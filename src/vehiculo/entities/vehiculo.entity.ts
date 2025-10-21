import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Conductor } from '../../conductor/entities/conductor.entity';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  placa: string;

  @Column({
    type: 'enum',
    enum: TipoVehiculo,
  })
  tipo: TipoVehiculo;

  @Column({ type: 'varchar', length: 50 })
  marca: string;

  @Column({ type: 'varchar', length: 50 })
  modelo: string;

  @Column({ type: 'varchar', length: 30 })
  color: string;

  @Column({ type: 'timestamp' })
  fechaCaducidad: Date;

  @Column({ type: 'varchar', length: 50 })
  conductorCodigo: string;

  // Relación con conductor (no se carga automáticamente)
  // @ManyToOne(() => Conductor, (conductor) => conductor.vehiculos)
  // @JoinColumn({ name: 'conductorCodigo' })
  // conductor?: Conductor;
}
