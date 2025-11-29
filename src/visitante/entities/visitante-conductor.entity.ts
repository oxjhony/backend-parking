import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad que representa un conductor visitante en el sistema.
 * Los visitantes son conductores temporales que no están en la base de datos institucional.
 */
@Entity('visitantes_conductores')
export class VisitanteConductor {
  /**
   * Número de cédula del visitante (clave primaria)
   */
  @PrimaryColumn({ length: 20 })
  cedula: string;

  /**
   * Nombre del visitante
   */
  @Column({ length: 100 })
  nombre: string;

  /**
   * Apellido del visitante
   */
  @Column({ length: 100 })
  apellido: string;

  /**
   * Número de teléfono de contacto del visitante
   */
  @Column({ length: 20 })
  telefono: string;

  /**
   * Correo electrónico del visitante (opcional)
   */
  @Column({ length: 100, nullable: true })
  correo: string | null;

  /**
   * Fecha de creación del registro
   * Se registra cuando el visitante se registra por primera vez en el sistema
   */
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  /**
   * Fecha de última actualización del registro
   */
  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
