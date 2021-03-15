import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstname: string;

    @Column()
    lastname: string;

    @Column()
    tel: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    adress: string;

    @Column()
    city: string;

    @Column()
    postalCode: string;

    @Column()
    role: string;

    @Column()
    activity: string;

    @Column('boolean', { default: false })
    emailAdressValidated: boolean;

    @Column('boolean', { default: false })
    validated: boolean;

    @BeforeInsert()
    useEmailUppercase() {
        this.email = this.email.toUpperCase();
    }
}
