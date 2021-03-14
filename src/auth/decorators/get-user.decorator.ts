import { createParamDecorator } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

export const GetUser = createParamDecorator((_, req): User => {
    return req.user;
});
