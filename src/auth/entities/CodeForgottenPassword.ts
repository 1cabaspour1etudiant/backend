import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

    @Column('integer')
    userId: number;
}
