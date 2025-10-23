import { IsString, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParqueaderoDto {
  @ApiProperty({ example: 'Parqueadero Central' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Cra 23 #26-10' })
  @IsString()
  @IsNotEmpty()
  direccion: string;

  @ApiProperty({ example: 50, description: 'Capacidad total de carros' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  capacidadCarros: number;

  @ApiProperty({ example: 50, description: 'Capacidad total de motos' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  capacidadMotos: number;

  @ApiProperty({ example: 50, description: 'Cupos disponibles iniciales para carros' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  cuposDisponiblesCarros: number;

  @ApiProperty({ example: 50, description: 'Cupos disponibles iniciales para motos' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  cuposDisponiblesMotos: number;
}
