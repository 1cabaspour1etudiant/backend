import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsString, Max, Min } from 'class-validator';

export class RecoverPasswordDto {
    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsInt()
    @Min(10 ** 4)
    @Max(10 ** 5)
    code: number;

    @ApiProperty()
    @IsString()
    password: string;
}
