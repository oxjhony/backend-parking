import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Parqueadero } from '../../parqueadero/entities/parqueadero.entity';
import { EstadoRegistro } from '../enums/estado-registro.enum';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  horaEntrada: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  horaSalida: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoRegistro,
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  // Relación con Vehiculo (Many-to-One)
  @Column({ type: 'varchar', length: 20 })
  vehiculoPlaca: string;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculoPlaca' })
  vehiculo: Vehiculo;

  // Relación con Usuario (Many-to-One)
  @Column({ type: 'int' })
  usuarioId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  // Relación con Parqueadero (Many-to-One)
  @Column({ type: 'int' })
  parqueaderoId: number;

  @ManyToOne(() => Parqueadero)
  @JoinColumn({ name: 'parqueaderoId' })
  parqueadero: Parqueadero;
}
