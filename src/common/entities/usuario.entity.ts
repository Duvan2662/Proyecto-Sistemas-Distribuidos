import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RolUsuario {
  ESTUDIANTE = 'estudiante',
  BIBLIOTECARIO = 'bibliotecario',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.ESTUDIANTE })
  rol: RolUsuario;
}
