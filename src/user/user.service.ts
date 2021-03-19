import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { InjectS3, S3 } from 'nestjs-s3';
import * as fs from 'fs';
import * as path from 'path';
import vision from '@google-cloud/vision';
import { Address } from './entities/address.entity';

@Injectable()
export class UserService {
    private readonly saltRounds = 10;

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        @InjectS3() private readonly s3: S3,
    ) {}

    private async saveAddress(createUserDto: CreateUserDto) {
        const address = this.addressRepository.create({
            address: createUserDto.address,
            city: createUserDto.city,
            zipCode: createUserDto.zipCode,
            longitude: 0,
            latitude: 0,
        });

        await this.addressRepository.save(address);
        return address;
    }

    private getUserPropertiesFromDto(createUserDto: CreateUserDto) {
        const { address: addressStreet, city, zipCode, ...userProperties } = createUserDto;
        return userProperties;
    }

    private async saveUser(address: Address, createUserDto: CreateUserDto) {
        const userProperties = this.getUserPropertiesFromDto(createUserDto);
        const passwordHashed = await hash(userProperties.password, this.saltRounds);

        const user: User = this.userRespository.create({
            ...userProperties,
            password: passwordHashed,
            address,
        });

        await this.userRespository.save(user);
        return user;
    }

    async createUser(createUserDto: CreateUserDto) {
        let user: User;
        createUserDto.email = createUserDto.email.toUpperCase();
        user = await this.userRespository.findOne({ where: { email: createUserDto.email } });

        if (user) {
            throw new ConflictException(`This email adress is already use`);
        }

        user = await this.saveUser(
            await this.saveAddress(createUserDto),
            createUserDto,
        );

        const payload = {
            email: user.email,
            sub: user.id
        };
        const token = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
        const verificationLink = `${process.env.EMAIL_VERIFICATION_HOST}/auth/checkEmail?token=${token}`;

        const emailOptions = {
            to: user.email,
            subject: 'Confirm your email adress',
            context: {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email.toLowerCase(),
                siteName: process.env.EMAIL_SITE_NAME,
                verificationLink,
            },
            template: 'index',
        };

        await this.mailerService.sendMail(emailOptions);
        return user;
    }

    async getUserByEmail(email: string) {
        return this.userRespository.findOne({
            where: { email: email.toUpperCase() },
            relations: ['address'],
        });
    }

    async updateUser(user: User, updateUserDto: UpdateUserDto) {
        if (typeof updateUserDto.email === "string") {
            updateUserDto.email = updateUserDto.email.toUpperCase();
        }

        const { address, city, zipCode, ...userProperties } = updateUserDto;

        if (address || city || zipCode) {
            const addressProperties = {
                address: address || user.address.address,
                city: city || user.address.city,
                zipCode: zipCode || user.address.zipCode,
            };
            await this.addressRepository.update({ id: user.address.id }, addressProperties);
        }

        await this.userRespository.update({ id: user.id }, userProperties);
    }

    async emailIsAvailable(email: string) {
        const user = await this.getUserByEmail(email);
        return user === undefined;
    }

    async updateValidatedEmailStatus(user: User, emailAdressValidated: boolean) {
        await this.userRespository.update({id : user.id}, { emailAdressValidated });
    }

    private wrapperUpload(Key: string, fileStream: fs.ReadStream) {
        return new Promise((resove, reject) => {
            this.s3.upload({
                Bucket: process.env.STORAGE_BUCKET_PICTURES,
                Key,
                Body: fileStream,
            }, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resove(data);
                }
            });
        });
    }

    private async checkProfilePicture(filePath: string) {
        const client = new vision.ImageAnnotatorClient();
        const [result] = await client.safeSearchDetection(filePath);
        const { adult, violence, racy, medical } = result.safeSearchAnnotation;

        const buildErrorMessage = (kind:string) => `Your picture seems including ${kind} content`;

        if (adult === 'VERY_LIKELY' || adult === 'LIKELY' || adult === 'POSSIBLE') {
            throw new UnauthorizedException(buildErrorMessage('adult'));
        }

        if (violence === 'VERY_LIKELY' || violence === 'LIKELY' || violence === 'POSSIBLE') {
            throw new UnauthorizedException(buildErrorMessage('violence'));
        }

        if (racy === 'VERY_LIKELY' || racy === 'LIKELY' || racy === 'POSSIBLE') {
            throw new UnauthorizedException(buildErrorMessage('racy'));
        }

        if (medical === 'VERY_LIKELY' || medical === 'LIKELY' || medical === 'POSSIBLE') {
            throw new UnauthorizedException(buildErrorMessage('medical'));
        }
    }

    async uploadUserProfilePicture(user: User, filePath: string) {
        await this.checkProfilePicture(filePath);

        const fileStream: fs.ReadStream = fs.createReadStream(filePath);
        const Key = path.basename(filePath);
        await this.wrapperUpload(Key, fileStream);
        return this.userRespository.update({ id: user.id }, { profilePictureKey: Key });
    }

    deleteUser(user: User) {
        return this.userRespository.delete({ id: user.id });
    }
}
