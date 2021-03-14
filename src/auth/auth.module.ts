import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, JwtService],
  imports: [UserModule]
})
export class AuthModule {}
