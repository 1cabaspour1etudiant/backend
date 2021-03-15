import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) {}

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
}
