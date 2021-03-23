import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Address } from './entities/address.entity';
import { Sponsorship } from './entities/sponsorship.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SponsorshipController } from './sponsorship.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, Sponsorship]),
    forwardRef(() => AuthModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '365d'  }
    }),
    MulterModule.register({
      dest: process.env.STORAGE_TEMPORARY_IMAGE,
    }),
    HttpModule,
  ],
  controllers: [UserController, SponsorshipController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
