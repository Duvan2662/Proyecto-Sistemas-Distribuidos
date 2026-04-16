import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Libro } from './libro.entity';
import { Usuario } from './usuario.entity';
import { Sede } from './sede.entity';

export enum EstadoPrestamo {
  ACTIVO = 'activo',
  DEVUELTO = 'devuelto',
  VENCIDO = 'vencido',
}

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'libro_id' })
  libroId: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro: Libro;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'sede_id' })
  sedeId: string;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'sede_id' })
  sede: Sede;

  @CreateDateColumn({ name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ name: 'fecha_devolucion', nullable: true })
  fechaDevolucion: Date;

  @Column({ type: 'enum', enum: EstadoPrestamo, default: EstadoPrestamo.ACTIVO })
  estado: EstadoPrestamo;
}
