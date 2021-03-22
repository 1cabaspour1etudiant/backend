import { ConflictException, HttpService, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { InjectS3, S3 as nestS3 } from 'nestjs-s3';
import * as fs from 'fs';
import * as path from 'path';
import vision from '@google-cloud/vision';
import { Address } from './entities/address.entity';
import { S3 } from 'aws-sdk';

type Geometry = {
    location: {
        lat: number,
        lng: number,
    }
};

type GeoCodingResponse = {
    results: { geometry: Geometry }[],
    status: string,
};

@Injectable()
export class UserService {
    private static readonly saltRounds = 10;
    private static urlResolveAddress = 'https://maps.googleapis.com/maps/api/geocode/json';

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        @InjectS3()
        private readonly s3: nestS3,
        private readonly httpService: HttpService,
    ) {}

    private async resolveAddress(addressStreet:string, city: string, zipCode: string) {
        const address = `${addressStreet},${city},${zipCode},France`;
        const options = {
            params: {
                address,
                key: process.env.GOOGLE_API_KEY,
            },
        };

        const { data: { results } } = await this.httpService.get<GeoCodingResponse>(UserService.urlResolveAddress, options).toPromise();

        if (results.length === 0) {
            throw new NotFoundException('Unknow address');
        }

        return results[0].geometry.location;
    }

    private async saveAddress(createUserDto: CreateUserDto) {
        const { lat, lng } = await this.resolveAddress(
            createUserDto.address,
            createUserDto.city,
            createUserDto.zipCode,
        );

        const address = this.addressRepository.create({
            address: createUserDto.address,
            city: createUserDto.city,
            zipCode: createUserDto.zipCode,
            longitude: lng,
            latitude: lat,
            location: {
                type: 'Point',
                coordinates: [lng, lat],
            }
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
        const passwordHashed = await hash(userProperties.password, UserService.saltRounds);

        const user: User = this.userRespository.create({
            ...userProperties,
            password: passwordHashed,
            address,
        });

        await this.userRespository.save(user);
        return user;
    }

    private async sendValidationEmail(user: User) {
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

        return this.mailerService.sendMail(emailOptions);
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

        await this.sendValidationEmail(user);

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

    private wrapperDownload(Key: string): Promise<S3.GetObjectOutput> {
        return new Promise((resolve, reject) => {
            this.s3.getObject({
                Bucket: process.env.STORAGE_BUCKET_PICTURES,
                Key,
            }, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
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

    async getClosestUsers(user: User) {
        const origin = {
            type: 'Point',
            coordinates: [
                user.address.longitude,
                user.address.latitude
            ],
        };

        const query = this.userRespository
            .query(`
                SELECT DISTINCT ON (distance) "user"."id" AS "id",
                "user"."firstname" AS "firstname",
                "user"."activityArea" AS "activityArea",
                "address"."address" AS "address",
                ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON($1), ST_SRID(location))) AS "distance"
                FROM "user" "user" INNER JOIN "address" "address" ON "address"."id"="user"."addressId"
                WHERE "user"."id" != $2 AND "user"."status" != $3
                ORDER BY distance ASC
            `, [
                JSON.stringify(origin),
                user.id,
                user.status,
            ]);

        return query;
    }
}
