import * as bcrypt from 'bcrypt';
import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';


@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) {}


    async validate(email: string, password: string) {
        const user = await this.userService.getUserByEmail(email);

        if (!user) {
            return null;
        }

        return await bcrypt.compare(password, user.password) ? user : null;
    }

    async login(user: User) {
        const payload = {
            email: user.email,
            sub: user.id
        };

        return {
            access_token: await this.jwtService.signAsync(payload, { secret: process.env.JWT_SECRET })
        };
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
}
