import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/entities/user.entity';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { RecoverPasswordDto } from './dto/recover-password-dto';
import SendPasswordRecoveryCode from './dto/send-password-recovery-code-dto';
import { JwtQueryGuard } from './guards/jwt-query.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@GetUser() user:User) {
        return this.authService.login(user);
    }

    @UseGuards(JwtQueryGuard)
    @Get('checkEmail')
    async checkEmail(@GetUser() user: User) {
        await this.authService.valideUserEmail(user);
    }

    @Post('/password/recoverycode')
    async sendPasswordRecoveryCode(@Body() sendRecoveryCodeDto: SendPasswordRecoveryCode) {
        await this.authService.sendPasswordRecoveryCode(sendRecoveryCodeDto);
    }

    @Post('/password/recover')
    async recoverPassword(@Body() recoverPasswordDto: RecoverPasswordDto) {
        await this.authService.recoverPassword(recoverPasswordDto);
    }
}
