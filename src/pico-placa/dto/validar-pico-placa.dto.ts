import { IsString, IsNotEmpty, Matches, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidarPicoPlacaDto {
  @ApiProperty({
    description: 'Placa del vehículo a validar',
    example: 'ABC123',
    pattern: '^[A-Z]{3}\\d{2}[A-Z0-9]$',
  })
  @IsString()
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  @Matches(/^[A-Z]{3}\d{2}[A-Z0-9]$/, {
    message: 'Formato de placa inválido. Debe seguir el formato colombiano (ej: ABC123)',
  })
  placa: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora para validar (opcional, por defecto usa la fecha/hora actual)',
    example: '2025-11-18T14:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fechaHora?: string;
}
