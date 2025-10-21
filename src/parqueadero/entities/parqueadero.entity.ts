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
  capacidad: number;

  @Column({ type: 'int' })
  cuposDisponibles: number;

  actualizarCupos(): void {
    // Lógica para actualizar cupos disponibles
  }
}
