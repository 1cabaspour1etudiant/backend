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
    zipCode: string;

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
