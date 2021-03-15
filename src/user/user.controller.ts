import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user-dto';
import { EmailIsAvailableDto } from './dto/email-is-available-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) {}

    @Get('emailIsAvailable')
    async emailIsAvailable(@Query() emailIsAvailableDto: EmailIsAvailableDto) {
        return this.userService.emailIsAvailable(emailIsAvailableDto.email);
    }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        await this.userService.createUser(createUserDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('/me')
    async updateUserMeInfos(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
        await this.userService.updateUser(user, updateUserDto);
        return updateUserDto;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/me')
    async getUserMeInfos(@GetUser() user: User) {
        const { password, ...userDto } = user;
        return userDto;
    }
}
