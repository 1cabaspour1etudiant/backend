import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';
import { hash } from 'bcrypt';


@Injectable()
export class UserService {
    private readonly saltRounds = 10;

    constructor(
        @InjectRepository(User)
        private readonly userRespository: Repository<User>
    ) {}

    async createUser(createUserDto: CreateUserDto) {
        let user;
        user = await this.userRespository.findOne({ where: { email: createUserDto.email } });

        if (user) {
            throw new ConflictException(`This email adress is already use`);
        }

        const passwordHashed = await hash(createUserDto.password, this.saltRounds);

        user = await this.userRespository.create({
            ...createUserDto,
            password: passwordHashed,
        });

        return this.userRespository.save(user);
    }

    async getUserByEmail(email: string) {
        return this.userRespository.findOne({ where: { email } });
    }
}
