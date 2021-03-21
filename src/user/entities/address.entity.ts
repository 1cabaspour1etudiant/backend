import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Geometry } from 'geojson';

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

    @Column('geometry')
    location: Geometry;

    @OneToOne(() => User, user => user.address)
    user: User;
}
