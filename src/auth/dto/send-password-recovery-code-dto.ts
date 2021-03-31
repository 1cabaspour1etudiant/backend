import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator'; 

export default class SendPasswordRecoveryCode {
    @ApiProperty()
    @IsEmail()
    email:string;
}
