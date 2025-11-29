import { ApiProperty } from '@nestjs/swagger';

export class PicoPlacaResponseDto {
  @ApiProperty({
    description: 'Indica si la placa tiene restricción activa',
    example: true,
  })
  tieneRestriccion: boolean;

  @ApiProperty({
    description: 'Placa validada',
    example: 'ABC123',
  })
  placa: string;

  @ApiProperty({
    description: 'Último dígito de la placa',
    example: 3,
  })
  ultimoDigito: number;

  @ApiProperty({
    description: 'Día de la semana evaluado',
    example: 'Martes',
  })
  diaSemana: string;

  @ApiProperty({
    description: 'Hora evaluada',
    example: 14,
  })
  hora: number;

  @ApiProperty({
    description: 'Indica si está dentro del horario de restricción',
    example: true,
  })
  dentroHorario: boolean;

  @ApiProperty({
    description: 'Dígitos restringidos para el día',
    example: [3, 4],
  })
  digitosRestringidos: number[];

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'La placa ABC123 tiene restricción de pico y placa el día Martes entre las 6:00 y 20:00',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Fecha y hora de la validación',
    example: '2025-11-18T14:30:00.000Z',
  })
  fechaValidacion: Date;
}
