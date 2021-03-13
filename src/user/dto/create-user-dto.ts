import { IsEmail, IsString } from 'class-validator';

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
    adresse: string;

    @IsString()
    city: string;

    @IsString()
    postalCode: string;

    @IsString()
    role:string;

    @IsString()
    activity: string;
}
