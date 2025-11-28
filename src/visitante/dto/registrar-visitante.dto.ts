import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoVehiculo } from '../../vehiculo/enums/tipo-vehiculo.enum';
import { CreateVisitanteConductorDto } from './create-visitante-conductor.dto';

/**
 * DTO para registrar un visitante completo (conductor + vehículo + entrada)
 */
export class RegistrarVisitanteDto {
  // Datos del visitante conductor
  @ApiProperty({
    description: 'Datos del conductor visitante',
    type: CreateVisitanteConductorDto,
  })
  @ValidateNested()
  @Type(() => CreateVisitanteConductorDto)
  conductor: CreateVisitanteConductorDto;

  // Datos del vehículo
  @ApiProperty({
    description: 'Placa del vehículo',
    example: 'ABC123',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'La placa solo debe contener letras mayúsculas y números',
  })
  placa: string;

  @ApiProperty({
    description: 'Tipo de vehículo',
    enum: TipoVehiculo,
    example: TipoVehiculo.CARRO,
  })
  @IsEnum(TipoVehiculo)
  tipoVehiculo: TipoVehiculo;

  @ApiProperty({
    description: 'Marca del vehículo (opcional)',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  marca?: string;

  @ApiProperty({
    description: 'Modelo del vehículo (opcional)',
    example: 'Corolla',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  modelo?: string;

  @ApiProperty({
    description: 'Color del vehículo (opcional)',
    example: 'Rojo',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  color?: string;

  @ApiProperty({
    description: 'Fecha de caducidad del permiso temporal (ISO 8601)',
    example: '2025-11-20T23:59:59.000Z',
  })
  @IsDateString()
  fechaCaducidad: string;

  // Datos del registro de entrada
  @ApiProperty({
    description: 'ID del parqueadero donde ingresa',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  parqueaderoId: number;

  @ApiProperty({
    description: 'Motivo de la visita (se guarda en el registro)',
    example: 'Reunión académica',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 255)
  motivoVisita: string;
}
