import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtQueryGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}
 
    async canActivate(ctx: ExecutionContext) {
        const req: Request = ctx.switchToHttp().getRequest();
        const verifyOptions = { secret: process.env.JWT_SECRET };
        const { query: { token } } = req;
        let decoded;

        if (typeof token !== 'string') {
            throw new UnauthorizedException('No token provided');
        }

        try {
            decoded = await this.jwtService.verifyAsync(token, verifyOptions);
        } catch(e) {
            throw new UnauthorizedException('Invalid token');
        }

        req.user =  await this.userService.getUserByEmail(decoded.email);

        return true;
    }
}
