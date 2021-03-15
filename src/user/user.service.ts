import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class UserService {
    private readonly saltRounds = 10;

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
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

        return this.mailerService.sendMail(emailOptions);
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
}
