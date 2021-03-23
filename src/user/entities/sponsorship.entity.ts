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

    @Column('date')
    date: Date;
}
