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

  @CreateDateColumn({ type: 'timestamp', name: 'horaEntrada' })
  horaEntrada: Date;

  @Column({ type: 'timestamp', nullable: true, default: null, name: 'horaSalida' })
  horaSalida: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoRegistro,
    default: EstadoRegistro.ACTIVO,
  })
  estado: EstadoRegistro;

  /**
   * Motivo de visita (solo para visitantes)
   * Este campo es opcional y se usa únicamente cuando el vehículo es de tipo VISITANTE
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'motivo_visita' })
  motivoVisita: string | null;

  // Relación con Vehiculo (Many-to-One)
  @Column({ type: 'varchar', length: 20, name: 'vehiculoPlaca' })
  vehiculoPlaca: string;

  @ManyToOne(() => Vehiculo)
  @JoinColumn({ name: 'vehiculoPlaca' })
  vehiculo: Vehiculo;

  // Relación con Usuario (Many-to-One)
  @Column({ type: 'int', name: 'usuarioId' })
  usuarioId: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  // Relación con Parqueadero (Many-to-One)
  @Column({ type: 'int', name: 'parqueaderoId' })
  parqueaderoId: number;

  @ManyToOne(() => Parqueadero)
  @JoinColumn({ name: 'parqueaderoId' })
  parqueadero: Parqueadero;
}
