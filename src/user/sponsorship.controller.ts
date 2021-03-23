import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreateSponsorShipDto } from './dto/create-sponsorship-dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('sponsorship')
export class SponsorshipController {

    constructor(private readonly userService: UserService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createSponsorShip(
        @Body() { godfatherId, godsonId }: CreateSponsorShipDto,
        @GetUser() user: User,
    ) {
        if (user.id != godfatherId && user.id != godsonId) {
            throw new ForbiddenException('Not allowed to create a sponsorship for someone else');
        }

        if (godfatherId === godsonId) {
            throw new ForbiddenException('Not allowed to create a sponsorship for yourself');
        }

        await this.userService.createSponsorship(godfatherId, godsonId, user.id === godfatherId ? godsonId : godfatherId);
    }
}
