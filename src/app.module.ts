import * as path from 'path';
import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { S3Module } from 'nestjs-s3';

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
        EMAIL_TRANSPORT: Joi.required(),
        EMAIL_FROM: Joi.required(),
        EMAIL_SITE_NAME: Joi.required(),
        EMAIL_VERIFICATION_HOST: Joi.required(),
        STORAGE_ACCESS_ID: Joi.required(),
        STORAGE_SECRET_ACCESS_KEY: Joi.required(),
        STORAGE_END_POINT: Joi.required(),
        STORAGE_BUCKET_PICTURES: Joi.required(),
        STORAGE_TEMPORARY_IMAGE: Joi.required(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.required(),
        GOOGLE_API_KEY: Joi.required(),
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
    AuthModule,
    MailerModule.forRoot({
      transport: process.env.EMAIL_TRANSPORT,
      defaults: {
        from: process.env.EMAIL_FROM,
      },
      template: {
        dir: path.join(process.cwd(), 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    S3Module.forRoot({
      config: {
        credentials: {
          accessKeyId: process.env.STORAGE_ACCESS_ID,
          secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
        },
        endpoint: process.env.STORAGE_END_POINT,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      }
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
