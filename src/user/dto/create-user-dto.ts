import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
    @IsString()
    firstname: string;

    @IsString()
    lastname: string;

    @IsString()
    tel: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @Length(6, 32)
    password: string;

    @IsString()
    adress: string;

    @IsString()
    city: string;

    @IsString()
    postalCode: string;

    @IsString()
    role:string;

    @IsString()
    activity: string;
}
