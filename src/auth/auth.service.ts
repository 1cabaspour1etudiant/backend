import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';


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

        return bcrypt.compare(password, user.password) ? user : null;
    }
}
