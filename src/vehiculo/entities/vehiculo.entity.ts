import { Entity, PrimaryColumn, Column } from 'typeorm';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { TipoPropietario } from '../enums/tipo-propietario.enum';

/**
 * Entidad que representa un vehículo en el sistema.
 * Soporta tanto vehículos institucionales como de visitantes mediante un discriminador.
 */
@Entity('vehiculos')
export class Vehiculo {
  /**
   * Placa del vehículo (clave primaria)
   */
  @PrimaryColumn({ type: 'varchar', length: 20 })
  placa: string;

  /**
   * Tipo de vehículo (CARRO, MOTO, etc.)
   */
  @Column({
    type: 'enum',
    enum: TipoVehiculo,
  })
  tipo: TipoVehiculo;

  /**
   * Tipo de propietario (INSTITUCIONAL o VISITANTE)
   * Este campo actúa como discriminador para relaciones polimórficas
   */
  @Column({
    type: 'enum',
    enum: TipoPropietario,
    name: 'tipo_propietario',
    nullable: true,
  })
  tipoPropietario: TipoPropietario;

  /**
   * ID del propietario
   * - Para INSTITUCIONAL: código del conductor (tabla conductores)
   * - Para VISITANTE: cédula del visitante (tabla visitantes_conductores)
   */
  @Column({ type: 'varchar', length: 50, name: 'propietario_id', nullable: true })
  propietarioId: string;

  /**
   * @deprecated Usar propietarioId en su lugar. Mantenido por compatibilidad.
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  conductorCodigo: string;

  /**
   * Marca del vehículo (opcional para visitantes)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  marca: string;

  /**
   * Modelo del vehículo (opcional para visitantes)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  modelo: string;

  /**
   * Color del vehículo (opcional para visitantes)
   */
  @Column({ type: 'varchar', length: 30, nullable: true })
  color: string;

  /**
   * Fecha de caducidad del permiso/sticker
   * Obligatorio para vehículos de visitantes (validado por trigger en BD)
   */
  @Column({ type: 'timestamp', name: 'fecha_caducidad', nullable: true })
  fechaCaducidad: Date;

  /**
   * NOTA: No incluimos relación @ManyToOne con Conductor porque propietarioId
   * es polimórfico (puede apuntar a conductores o visitantes_conductores).
   * Las consultas deben hacerse manualmente según tipoPropietario.
   * La integridad referencial se garantiza mediante triggers en la base de datos.
   */
}
