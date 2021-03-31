import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class CodeForgottenPassword {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('integer')
    code: number;

    @Column('date')
    date: Date;

    @Column('boolean', { default: false })
    used: boolean;

    @OneToOne(() => User)
    user: User;
}
