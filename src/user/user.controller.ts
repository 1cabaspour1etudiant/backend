import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';

@Controller('user')
export class UserController {
    @Post()
    createUser(@Body() createUserDto: CreateUserDto) {

    }
}
