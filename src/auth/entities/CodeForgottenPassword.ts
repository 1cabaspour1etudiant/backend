import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CodeForgottenPassword {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('integer')
    code: number;

    @Column('timestamp with time zone')
    timestamp: Date;

    @Column('boolean', { default: false })
    used: boolean;

    @Column('integer')
    userId: number;
}
