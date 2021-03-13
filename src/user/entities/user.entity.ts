import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstname: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    postalCode: string;

    @Column()
    street: string;

    @Column()
    city: string;

    @Column('boolean', { default: false })
    validated: boolean;

    @Column()
    activity: string;
}
