import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

const port = Number(process.env.POSTGRES_PORT);

const typeOrmOptions:TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  autoLoadEntities: true,
  synchronize: process.env.PRODUCTION === 'false',
};

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forRoot(typeOrmOptions)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
