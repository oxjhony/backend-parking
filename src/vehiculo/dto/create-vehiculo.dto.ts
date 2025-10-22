import { IsString, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehiculoDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({ enum: TipoVehiculo, example: TipoVehiculo.CARRO })
  @IsEnum(TipoVehiculo)
  @IsNotEmpty()
  tipo: TipoVehiculo;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  marca: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  modelo: string;

  @ApiProperty({ example: 'Rojo' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  fechaCaducidad: string;

  @ApiProperty({ example: '0000028932' })
  @IsString()
  @IsNotEmpty()
  conductorCodigo: string;
}
