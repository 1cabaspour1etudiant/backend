import { ConflictException, Injectable } from '@nestjs/common';
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

@Injectable()
export class UserService {
    private readonly saltRounds = 10;

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        @InjectS3() private readonly s3: S3,
    ) {}

    async createUser(createUserDto: CreateUserDto) {
        let user: User;
        createUserDto.email = createUserDto.email.toUpperCase();
        user = await this.userRespository.findOne({ where: { email: createUserDto.email } });

        if (user) {
            throw new ConflictException(`This email adress is already use`);
        }

        const passwordHashed = await hash(createUserDto.password, this.saltRounds);

        user = this.userRespository.create({
            ...createUserDto,
            password: passwordHashed,
        });

        await this.userRespository.save(user);
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
        return this.userRespository.findOne({ where: { email: email.toUpperCase() } });
    }

    async updateUser(user: User, updateUserDto: UpdateUserDto) {
        if (typeof updateUserDto.email === "string") {
            updateUserDto.email = updateUserDto.email.toUpperCase();
        }
        await this.userRespository.update({ id: user.id }, { ...updateUserDto });
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

    async uploadUserProfilePicture(user: User, filePath: string) {
        const fileStream: fs.ReadStream = fs.createReadStream(filePath);
        const Key = path.basename(filePath);
        await this.wrapperUpload(Key, fileStream);
        return this.userRespository.update({ id: user.id }, { profilePictureKey: Key });
    }
}
