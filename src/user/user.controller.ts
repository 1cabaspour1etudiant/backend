import { Body, Controller, Delete, ForbiddenException, Get, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { AuthService } from 'src/auth/auth.service';
import { TypeTokenPayload } from 'src/auth/types/TypeTokenPayload';
import { UserSearch } from './types/userSearch';
import { SearchUserDto } from './dto/search-user-dto';
import { GetUserProfilePictureDto } from './dto/get-user-profile-picture-dto';

@Controller('user')
export class UserController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
    ) {}

    @Get('emailIsAvailable')
    async emailIsAvailable(@Query() emailIsAvailableDto: EmailIsAvailableDto) {
        return this.userService.emailIsAvailable(emailIsAvailableDto.email);
    }

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.createUser(createUserDto);
        const payload: TypeTokenPayload = {
            email: user.email,
            sub: user.id,
        };
        return this.authService.getToken(payload);
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
        if (!file) {
            throw new ForbiddenException('No file found in request');
        }

        await this.userService.uploadUserProfilePicture(user, file.path);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/me/profilePicture')
    getUserMeProfilePicture(@GetUser() user: User) {
        return this.userService.getUserProfilePicture(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('/me')
    async deleteUserMe(@GetUser() user:User) {
        await this.userService.deleteUser(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/search')
    async getClosestUsers(@GetUser() user:User, @Query() searchUserDto: SearchUserDto) {
        const { page, pageSize } = searchUserDto;
        const start = pageSize * page;
        const end = start + pageSize;

        const closestUsers = await this.userService.getClosestUsers(user);

        const items: UserSearch[] = closestUsers.slice(start, end)
            .map((user) => {
                return {
                    id: user.id,
                    firstname: user.firstname,
                    activityArea: user.activityArea,
                    address: user.address,
                    distance: user.distance,
                };
            });

        return {
            page,
            pageSize: items.length,
            lastPage: end >= closestUsers.length,
            items,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/profilePicture')
    async getUserProfilePicture(@Query() { id }: GetUserProfilePictureDto) {
        return this.userService.getUserProfilePictureById(id);
    }
}
