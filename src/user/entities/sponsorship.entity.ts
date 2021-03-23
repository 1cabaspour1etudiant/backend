import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Sponsorship {
    @PrimaryGeneratedColumn()
    sponsorshipId: number;

    @Column()
    @OneToOne(() => User, (user) => user.id)
    godFatherId: number;

    @Column()
    @OneToOne(() => User, (user) => user.id)
    godSonId: number;
}
