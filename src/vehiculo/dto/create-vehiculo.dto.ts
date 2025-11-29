import { IsString, IsEnum, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { TipoPropietario } from '../enums/tipo-propietario.enum';
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

  @ApiProperty({ 
    enum: TipoPropietario, 
    example: TipoPropietario.INSTITUCIONAL,
    description: 'Tipo de propietario del vehículo'
  })
  @IsEnum(TipoPropietario)
  @IsNotEmpty()
  tipoPropietario: TipoPropietario;

  @ApiProperty({ 
    example: '0000028932',
    description: 'Código del conductor institucional o cédula del visitante'
  })
  @IsString()
  @IsNotEmpty()
  propietarioId: string;

  @ApiProperty({ example: 'Toyota', required: false })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiProperty({ example: 'Corolla', required: false })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiProperty({ example: 'INT-0001', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  fechaCaducidad: string;
}
