import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    address: string;

    @Column()
    city: string;

    @Column()
    zipCode: string;

    @Column('float8')
    longitude: number;

    @Column('float8')
    latitude: number;
}
