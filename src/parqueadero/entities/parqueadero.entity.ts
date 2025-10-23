import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('parqueaderos')
export class Parqueadero {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 200 })
  direccion: string;

  @Column({ type: 'int' })
  capacidadCarros: number;

  @Column({ type: 'int' })
  capacidadMotos: number;

  @Column({ type: 'int' })
  cuposDisponiblesCarros: number;

  @Column({ type: 'int' })
  cuposDisponiblesMotos: number;

  // Métodos de compatibilidad (deprecated pero útiles para migración)
  get capacidad(): number {
    return this.capacidadCarros + this.capacidadMotos;
  }

  get cuposDisponibles(): number {
    return this.cuposDisponiblesCarros + this.cuposDisponiblesMotos;
  }
}
