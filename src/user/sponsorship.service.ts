import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sponsorship } from './entities/sponsorship.entity';
import { User } from './entities/user.entity';
import { Expo } from 'expo-server-sdk';

enum NOTIFICATION_TYPES {
    SPONSORSHIP_REQUEST = 'SPONSORSHIP_REQUEST',
    SPONSORSHIP_ACCEPTED = 'SPONSORSHIP_ACCEPTED',
};

@Injectable()
export class SponsorshipService {
    private expo:Expo;

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>,
        @InjectRepository(Sponsorship)
        private readonly sponsorshipRepository: Repository<Sponsorship>,
    ) {
        this.expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
    }

    async getSponsorship(godfatherId: number, godsonId: number) {
        return this.sponsorshipRepository.findOne({ where: { godfatherId, godsonId } });
    }

    async createSponsorship(godfatherId: number, godsonId: number, recipientId: number, emitterId: number) {
        let sponsorship: Sponsorship;
        let godfather: User;
        let godson: User;
        let recipient: User;
        let emitter: User;

        godfather = await this.userRespository.findOne({ where: { id: godfatherId } });
        if (!godfather) {
            throw new NotFoundException(`Unknow godfather for id ${godfatherId}`);
        }

        if (godfather.status !== 'godfather') {
            throw new ForbiddenException(`Id ${godfatherId} does not refer to a godfather`);
        }

        godson = await this.userRespository.findOne({ where: { id: godsonId } });
        if (!godson) {
            throw new NotFoundException(`Unknow godson for id ${godsonId}`);
        }

        if (godson.status !== 'godson') {
            throw new ForbiddenException(`Id ${godsonId} does not refer to a godson`);
        }

        if (recipientId === godfatherId) {
            recipient = godfather;
            emitter = godson;
        } else {
            recipient = godson;
            emitter = godfather;
        }

        sponsorship = await this.getSponsorship(godfatherId, godsonId);
        if (sponsorship) {
            throw new ConflictException('Sponsorship already exist');
        }

        sponsorship = new Sponsorship();
        sponsorship.godfatherId = godfatherId;
        sponsorship.godsonId = godsonId;
        sponsorship.recipientId = recipientId;
        sponsorship.emitterId = emitterId;
        sponsorship.date = new Date();

        await this.sponsorshipRepository.save(sponsorship);
        if (recipient.pushToken) {
            let sentence:string;

            if (emitter.status === 'godson') {
                sentence = `${emitter.firstname} vous propose d'être son parrain`;
            } else {
                sentence = `${emitter.firstname} vous propose d'être votre parrain`;
            }

            await this.expo.sendPushNotificationsAsync([{
                to: recipient.pushToken,
                sound: 'default',
                body: sentence,
                data: {
                    emitterId,
                    date: new Date(),
                    type: NOTIFICATION_TYPES.SPONSORSHIP_REQUEST,
                },
            }]);
        }
    }

    async getAwatingSponsoshipRequests(user: User, type: string) {
        const where = [];
        if (type === 'received') {
            where.push(
                {
                    godfatherId: user.id,
                    validated: false,
                    recipientId: user.id,
                },
                {
                    godsonId: user.id,
                    validated: false,
                    recipientId: user.id,
                },
            );
        } else {
            where.push(
                {
                    godfatherId: user.id,
                    validated: false,
                    emitterId: user.id,
                },
                {
                    godsonId: user.id,
                    validated: false,
                    emitterId: user.id,
                },
            );
        }

        return this.sponsorshipRepository.find({ where });
    }

    private async checkSponsorship(sponsorshipId: number) {
        const sponsorship = await this.sponsorshipRepository.findOne({ where: { sponsorshipId } });
        if (!sponsorship) {
            throw new NotFoundException(`Unknow sponsorship's id ${sponsorshipId}`);
        }

        return sponsorship;
    }

    async acceptAwaitingSponsorshipRequest(user:User, sponsorshipId: number) {
        let emitter: User;
        const sponsorship = await this.checkSponsorship(sponsorshipId);
        if (sponsorship.recipientId !== user.id) {
            throw new ForbiddenException('Not allowed to validate this sponsorship request');
        }

        await this.sponsorshipRepository.update({ sponsorshipId }, { validated: true });

        emitter = await this.userRespository.findOne(sponsorship.emitterId);
        if (emitter && emitter.pushToken) {
            let sentence:string;

            if (emitter.status === 'godson') {
                sentence = `${user.firstname} est maintenant votre parrain`;
            } else {
                sentence = `${user.firstname} est maintenant votre filleul`;
            }

            await this.expo.sendPushNotificationsAsync([{
                to: emitter.pushToken,
                body: sentence,
                data: {
                    emitterId: emitter.id,
                    date: new Date(),
                    type: NOTIFICATION_TYPES.SPONSORSHIP_ACCEPTED,
                }
            }]);
        }
    }

    async deleteSponsorship(user: User, sponsorshipId: number) {
        const sponsorship = await this.checkSponsorship(sponsorshipId);
        if (sponsorship.godsonId !== user.id && sponsorship.godfatherId !== user.id) {
            throw new ForbiddenException('Not allowed to remove a sponsorship which is not yours');
        }

        return this.sponsorshipRepository.delete({ sponsorshipId });
    }

    async getGodfatherGodchildren(user: User) {
        const query = await this.sponsorshipRepository
            .query(`
                SELECT "user"."id" AS "userId",
                "user"."firstname" AS "firstname",
                "user"."lastname" AS "lastname",
                "user"."tel" AS "tel",
                "address"."address" AS "address",
                "sponsorship"."sponsorshipId" AS "sponsorshipId",
                "sponsorship"."date" AS "sponsorshipDate"
                FROM "user" "user"
                INNER JOIN "address" "address" ON "address"."id"="user"."addressId"
                INNER JOIN "sponsorship" "sponsorship" ON "sponsorship"."godsonId"="user"."id"
                WHERE "sponsorship"."godfatherId"=$1 AND "sponsorship"."validated"=true
            `, [
                user.id
            ]);

        return query;
    }

    async getGodsonGodfather(user: User) {
        if (user.status !== 'godson') {
            throw new ForbiddenException('Only a godson can have a godfather');
        }

        const query = await this.sponsorshipRepository
            .query(`
                SELECT "user"."id" AS "userId",
                "user"."firstname" AS "firstname",
                "user"."lastname" AS "lastname",
                "user"."tel" AS "tel",
                "address"."address" AS "address",
                "sponsorship"."sponsorshipId" AS "sponsorshipId",
                "sponsorship"."date" AS "sponsorshipDate"
                FROM "user" "user"
                INNER JOIN "address" "address" ON "address"."id"="user"."addressId"
                INNER JOIN "sponsorship" "sponsorship" ON "sponsorship"."godfatherId"="user"."id"
                WHERE "sponsorship"."godsonId"=$1 AND "sponsorship"."validated"=true
            `, [
                user.id
            ]);

        const [ godfather ] = await query;
        if (!godfather) {
            throw new NotFoundException('No godfather found');
        }

        return godfather;
    }
}
