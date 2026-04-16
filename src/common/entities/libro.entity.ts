import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Sede } from './sede.entity';

export enum EstadoLibro {
  DISPONIBLE = 'disponible',
  PRESTADO = 'prestado',
  RESERVADO = 'reservado',
}

@Entity('libros')
export class Libro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column()
  autor: string;

  @Column({ unique: true })
  isbn: string;

  @Column({ type: 'enum', enum: EstadoLibro, default: EstadoLibro.DISPONIBLE })
  estado: EstadoLibro;

  @Column({ name: 'sede_id' })
  sedeId: string;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @Column({ default: false })
  esReplica: boolean;
}
