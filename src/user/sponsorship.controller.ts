import { Body, Controller, Delete, ForbiddenException, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AcceptSponsorshipDto } from './dto/accept-sponsorship-dto';
import { CreateSponsorShipDto } from './dto/create-sponsorship-dto';
import { DeleteSponsorshipDto } from './dto/delete-sponsorship-dto';
import { GetGodfatherGodChildren } from './dto/get-godfather-godchildren-dto';
import { GetSponsorshipRequestsDto } from './dto/get-sponsorship-requests-dto';
import { User } from './entities/user.entity';
import { SponsorshipService } from './sponsorship.service';
import { UserService } from './user.service';

@Controller('sponsorship')
export class SponsorshipController {

    constructor(
        private readonly userService: UserService,
        private readonly sponsorshipService: SponsorshipService,
    ) {}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createSponsorShip(
        @Body() { godfatherId, godsonId }: CreateSponsorShipDto,
        @GetUser() user: User,
    ) {
        let recipientId;
        let emitterId;
        if (user.id != godfatherId && user.id != godsonId) {
            throw new ForbiddenException('Not allowed to create a sponsorship for someone else');
        }

        if (godfatherId === godsonId) {
            throw new ForbiddenException('Not allowed to create a sponsorship for yourself');
        }

        if (user.id === godfatherId) {
            recipientId = godsonId;
            emitterId = godfatherId;
        } else {
            recipientId = godfatherId;
            emitterId = godsonId;
        }

        await this.sponsorshipService.createSponsorship(godfatherId, godsonId, recipientId, emitterId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/requests')
    async getAwatingSponsorshipRequests(@GetUser() user:User, @Query() { page, pageSize, type }: GetSponsorshipRequestsDto) {
        const awaitingRequests = await this.sponsorshipService.getAwatingSponsoshipRequests(user, type);
        return this.userService.createPage(page, pageSize, awaitingRequests);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Put('/accept')
    async acceptSponsorship(@GetUser() user: User, @Body() { sponsorshipId }: AcceptSponsorshipDto) {
        await this.sponsorshipService.acceptAwaitingSponsorshipRequest(user, sponsorshipId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete()
    async deleteSponsorship(@GetUser() user: User, @Body() { sponsorshipId }: DeleteSponsorshipDto) {
        await this.sponsorshipService.deleteSponsorship(user, sponsorshipId);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('godfather')
    async getGodsonGodfather(@GetUser() user: User) {
        return this.sponsorshipService.getGodsonGodfather(user);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('godsons')
    async getGodfatherGodChildren(@GetUser() user: User, @Query() { page, pageSize }: GetGodfatherGodChildren) {
        const godChildren = await this.sponsorshipService.getGodfatherGodchildren(user);
        return this.userService.createPage(page, pageSize, godChildren);
    }
}
