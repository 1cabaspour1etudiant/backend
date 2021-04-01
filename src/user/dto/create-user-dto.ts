import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    firstname: string;

    @ApiProperty()
    @IsString()
    lastname: string;

    @ApiProperty()
    @IsString()
    tel: string;

    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @Length(6, 32)
    password: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsString()
    city: string;

    @ApiProperty()
    @IsString()
    zipCode: string;

    @ApiProperty()
    @IsString()
    status:string;
}
