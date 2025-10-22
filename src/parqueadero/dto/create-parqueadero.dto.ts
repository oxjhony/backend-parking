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

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  capacidad: number;

  @ApiProperty({ example: 80 })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  cuposDisponibles: number;
}
