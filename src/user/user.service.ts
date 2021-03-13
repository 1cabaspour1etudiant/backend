import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user-dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
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

        user = await this.userRespository.create(createUserDto);
        return this.userRespository.save(user);
    }
}
