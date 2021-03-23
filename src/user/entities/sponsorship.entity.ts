import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Sponsorship {
    @PrimaryGeneratedColumn()
    sponsorshipId: number;

    @Column()
    @OneToOne(() => User, (user) => user.id)
    godfatherId: number;

    @Column()
    @OneToOne(() => User, (user) => user.id)
    godsonId: number;

    @Column()
    @OneToOne(() => User, (user) => user.id)
    recipientId: number;

    @Column('boolean', { default: false })
    validated: boolean;

    @Column('date')
    date: Date;
}
