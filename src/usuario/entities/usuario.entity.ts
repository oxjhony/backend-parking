import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RolUsuario } from '../enums/rol-usuario.enum';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  cedula: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 255, select: false })
  claveEncriptada: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.VIGILANTE })
  rol: RolUsuario;
}