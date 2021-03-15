import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailIsAvailableDto {
    @ApiProperty()
    @IsEmail()
    email: string;
}
