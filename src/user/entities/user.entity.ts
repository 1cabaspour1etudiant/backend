import { BeforeInsert, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Address } from "./address.entity";

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

    @OneToOne(() => Address)
    @JoinColumn()
    address: Address;

    @Column()
    status: string;

    @Column()
    activityArea: string;

    @Column('boolean', { default: false })
    emailAdressValidated: boolean;

    @Column('boolean', { default: false })
    validated: boolean;

    @Column('varchar', { nullable: true })
    profilePictureKey: string;

    @Column('boolean', { default: false })
    profilePictureValidated: string;

    @BeforeInsert()
    useEmailUppercase() {
        this.email = this.email.toUpperCase();
    }
}
