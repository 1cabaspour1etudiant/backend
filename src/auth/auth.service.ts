import * as bcrypt from 'bcrypt';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { TypeTokenDecoded } from './types/TypeTokenDecoded';
import { TypeTokenPayload } from './types/TypeTokenPayload';
import SendPasswordRecoveryCode from './dto/send-password-recovery-code-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeForgottenPassword } from './entities/CodeForgottenPassword';
import { RecoverPasswordDto } from './dto/recover-password-dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
        @InjectRepository(CodeForgottenPassword)
        private readonly passwordRecoveryCodeEntity: Repository<CodeForgottenPassword>,
    ) {}


    async validate(email: string, password: string) {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            return null;
        }

        return await bcrypt.compare(password, user.password) ? user : null;
    }

    async getToken(payload: TypeTokenPayload) {
        const accessToken = await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
        const decoded = this.jwtService.decode(accessToken, { json: true }) as TypeTokenDecoded;

        return {
            accessToken,
            accessTokenExpirationDate: decoded.exp,
        };
    }

    login(user: User) {
        const payload = {
            email: user.email,
            sub: user.id
        };

        return this.getToken(payload);
    }

    async verify(token: string) {
        const decoded = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
        
        const user = await this.userService.getUserByEmail(decoded.email);

        if (!user) {
            throw new ForbiddenException('Unable to get the user from the given token');
        }

        return user;
    }

    async valideUserEmail(user: User) {
        if (user.emailAdressValidated) {
            throw new ConflictException('Email adress is already validated');
        }

        return this.userService.updateValidatedEmailStatus(user, true);
    }

    async sendPasswordRecoveryCode(sendPasswordRecoveryCode: SendPasswordRecoveryCode) {
        const user = await this.userService.getUserByEmail(sendPasswordRecoveryCode.email);
        if (user) {
            const recoveryCode = this.passwordRecoveryCodeEntity.create();
            recoveryCode.userId = user.id;
            recoveryCode.timestamp = new Date();
            recoveryCode.code = Math.floor(Math.random() * (10**5 - 10**4) + 10**4);
            await this.passwordRecoveryCodeEntity.save(recoveryCode);

            const emailOptions = {
                to: user.email,
                subject: 'Recovery code for update you password',
                context: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email.toLowerCase(),
                    code: recoveryCode.code
                },
                template: 'recovery-password',
            };

            await this.mailerService.sendMail(emailOptions);
        }
    }

    async recoverPassword(recoverPasswordDto: RecoverPasswordDto) {
        const user = await this.userService.getUserByEmail(recoverPasswordDto.email);
        if (user) {
            const passwordRecovery = await this.passwordRecoveryCodeEntity.findOne({
                where: {
                    code: recoverPasswordDto.code,
                    userId: user.id,
                    used: false
                }
            });

            if (!passwordRecovery) {
                throw new ForbiddenException();
            }

            const currentTime = new Date().getTime();
            const passwordRecoveryTime = new Date(passwordRecovery.timestamp).getTime();

            if ((currentTime - passwordRecoveryTime) > (15 * 1000 * 60)) {
                throw new ForbiddenException('Recovery code availability expired');
            }

            await Promise.all([
                this.passwordRecoveryCodeEntity.update(passwordRecovery.id, { used: true }),
                this.userService.updateUser(user, { password: recoverPasswordDto.password })
            ]);
        }
    }
}
