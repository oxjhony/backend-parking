import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({
    example: {
      id: 1,
      nombre: 'Juan Pérez',
      correo: 'juan.perez@ucaldas.edu.co',
      rol: 'VIGILANTE',
    },
  })
  user: {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
  };
}
