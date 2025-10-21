import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Vehiculo } from '../../vehiculo/entities/vehiculo.entity';

@Entity('conductores')
export class Conductor {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ type: 'varchar', length: 50 })
  apellido: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 20 })
  telefono: string;

  // Relación con vehículos (no se carga automáticamente)
  // @OneToMany(() => Vehiculo, (vehiculo) => vehiculo.conductor)
  // vehiculos?: Vehiculo[];
}
