import { Injectable } from '@nestjs/common';
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
        const user = await this.userRespository.create(createUserDto);
        return this.userRespository.save(user);
    }
}
