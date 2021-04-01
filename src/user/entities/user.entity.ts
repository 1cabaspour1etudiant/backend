import { BeforeInsert, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Address } from "./address.entity";

export enum UserStatus {
    ADMIN = 'admin',
    GODSON = 'godson',
    GODFATHER = 'godfather'
};

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

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.GODSON,
    })
    status: string;

    @Column('boolean', { default: false })
    emailAdressValidated: boolean;

    @Column('boolean', { default: false })
    validated: boolean;

    @Column('varchar', { nullable: true })
    profilePictureKey: string;

    @Column('boolean', { default: false })
    profilePictureValidated: string;

    @Column('varchar', { nullable: true })
    pushToken: string;

    @BeforeInsert()
    useEmailUppercase() {
        this.email = this.email.toUpperCase();
    }
}
