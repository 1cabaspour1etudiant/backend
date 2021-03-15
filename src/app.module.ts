import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        PRODUCTION: Joi.boolean(),
        POSTGRES_HOST: Joi.required(),
        POSTGRES_PORT: Joi.number().default(5432),
        POSTGRES_USERNAME: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.required(),
        POSTGRES_DATABASE: Joi.required(),
        JWT_SECRET: Joi.required(),
      }),
    }),
    UserModule,
    TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        username: process.env.POSTGRES_USERNAME,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        autoLoadEntities: true,
        synchronize: process.env.PRODUCTION === 'false',
      }
    ),
    AuthModule
  ],
  providers: [AppService],
})
export class AppModule {}
