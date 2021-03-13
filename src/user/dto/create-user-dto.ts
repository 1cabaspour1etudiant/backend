import { IsString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    firstname: string;

    @IsString()
    lastname: string;

    @IsString()
    tel: string;

    @IsString()
    email: string;

    @IsString()
    adresse: string;

    @IsString()
    city: string;

    @IsString()
    postalCode: string;

    @IsString()
    status: string;

    @IsString()
    activity: string;
}
