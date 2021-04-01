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
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUserDto } from './dto/get-user-dto';

@Controller('user')
export class UserController {

    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService,
    ) {}

    private formatUserInfos(user: User) {
        const {
            password,
            id:userId,
            pushToken,
            profilePictureKey,
            profilePictureValidated,
            emailAdressValidated,
            useEmailUppercase,
            ...userDto
        } = user;
        return {
            userId,
            ...userDto,
        };
    }

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

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('/me')
    async updateUserMeInfos(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
        await this.userService.updateUser(user, updateUserDto);
        const userUpdated = await this.userService.getUserByEmail(user.email);
        return this.formatUserInfos(userUpdated);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/me')
    async getUserMeInfos(@GetUser() user: User) {
        return this.formatUserInfos(user);
    }

    @ApiBearerAuth()
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

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/me/profilePicture')
    getUserMeProfilePicture(@GetUser() user: User) {
        return this.userService.getUserProfilePicture(user);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('/me')
    async deleteUserMe(@GetUser() user:User) {
        await this.userService.deleteUser(user);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/search')
    async getClosestUsers(@GetUser() user:User, @Query() { page, pageSize }: SearchUserDto) {
        const closestUsers = await this.userService.getClosestUsers(user);
        const pageItems = this.userService.createPage<UserSearch>(page, pageSize, closestUsers);
        pageItems.items = pageItems.items.map((item) => ({...item, contacted: item.sponsorshipId !== null}));
        return pageItems;
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/profilePicture')
    async getUserProfilePicture(@Query() { userId }: GetUserProfilePictureDto) {
        return this.userService.getUserProfilePictureById(userId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getUserInfos(@GetUser() user:User, @Query() { userId }: GetUserDto) {
        return this.userService.getUserInfos(user, userId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/me/hasgodfather')
    async getUserMeHasGodfather(@GetUser() user:User) {
        return this.userService.getUserMeHasGodfather(user);
    }
}
