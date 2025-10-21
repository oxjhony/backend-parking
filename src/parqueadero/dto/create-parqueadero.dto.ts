import { IsString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateParqueaderoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacidad: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  cuposDisponibles: number;
}
