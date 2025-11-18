import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PicoPlacaService } from './pico-placa.service';
import { ValidarPicoPlacaDto } from './dto/validar-pico-placa.dto';
import { PicoPlacaResponseDto } from './dto/pico-placa-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuario/enums/rol-usuario.enum';

@ApiTags('pico-placa')
@Controller('pico-placa')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PicoPlacaController {
  constructor(private readonly picoPlacaService: PicoPlacaService) {}

  @Post('validar')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({
    summary: 'Validar restricción de pico y placa',
    description:
      'Valida si una placa tiene restricción de pico y placa activa según el día y hora. ' +
      'Reglas: Lunes(1,2), Martes(3,4), Miércoles(5,6), Jueves(7,8), Viernes(9,0). ' +
      'Horario: 6:00 AM - 8:00 PM',
  })
  @ApiBody({ type: ValidarPicoPlacaDto })
  @ApiResponse({
    status: 200,
    description: 'Validación realizada exitosamente',
    type: PicoPlacaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de placa inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o expirado',
  })
  validar(@Body() validarDto: ValidarPicoPlacaDto): PicoPlacaResponseDto {
    return this.picoPlacaService.validarPicoPlaca(validarDto);
  }
}
