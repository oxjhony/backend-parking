import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class RegistrarSalidaDto {
  @ApiPropertyOptional({
    example: '2025-10-23T15:30:00Z',
    description: 'Hora de salida del vehículo (opcional, se usa la hora actual si no se especifica)',
  })
  @IsOptional()
  @IsDateString()
  horaSalida?: string;
}
