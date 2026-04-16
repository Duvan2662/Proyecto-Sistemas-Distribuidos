import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  ciudad: string;

  @Column()
  direccion: string;
}
