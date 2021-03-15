import { Body, Controller, Get, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user-dto';
import { EmailIsAvailableDto } from './dto/email-is-available-dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { diskStorage } from 'multer';
import * as path from 'path';

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

    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            filename: (req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                const ext = `${path.extname(file.originalname)}`;
                cb(null, `profilePicture-${uniqueSuffix}${ext}`);
            }
        })
    }))
    @Put('/me/profilePicture')
    async uploadUserMePictureProfile(
        @UploadedFile() file: Express.Multer.File,
        @GetUser() user: User,
    ) {
        
        await this.userService.uploadUserProfilePicture(user, file.path);
    }
}
