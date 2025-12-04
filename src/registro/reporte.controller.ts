import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuario/enums/rol-usuario.enum';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';
import { Response } from 'express';
import { ReporteService } from './reporte.service';

@ApiTags('reporte')
@Controller('reporte')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @Get()
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERUSUARIO,
    RolUsuario.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Reporte PDF de carros por fecha' })
  @ApiQuery({ name: 'fecha', required: true, example: '2025-01-01' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF del reporte.',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  async reportePdf(@Query('fecha') fecha: string, @Res() res: Response) {
    return this.reporteService.descargarReporteCarrosPorFecha(fecha, res);
  }

  @Get('parqueadero/semana')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERUSUARIO,
    RolUsuario.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Reporte del parqueadero por semana' })
  @ApiQuery({ name: 'inicio', required: true, example: '2025-11-10' })
  @ApiQuery({ name: 'fin', required: true, example: '2025-11-16' })
  @ApiProduces('application/pdf')
  async parqueaderoSemana(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    return this.reporteService.descargarReporteParqueaderoPorSemana(
      inicio,
      fin,
      res,
    );
  }

  @Get('parqueadero/mes')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERUSUARIO,
    RolUsuario.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Reporte del parqueadero por mes' })
  @ApiQuery({ name: 'anio', required: true, example: 2025 })
  @ApiQuery({ name: 'mes', required: true, example: 11 })
  @ApiProduces('application/pdf')
  async parqueaderoMes(
    @Query('anio') anio: string,
    @Query('mes') mes: string,
    @Res() res: Response,
  ) {
    return this.reporteService.descargarReporteParqueaderoPorMes(
      +anio,
      +mes,
      res,
    );
  }

  @Get('vehiculo/semana')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERUSUARIO,
    RolUsuario.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Reporte por tipo de vehículo por semana' })
  @ApiQuery({
    name: 'tipo',
    required: true,
    enum: TipoVehiculo,
    example: TipoVehiculo.CARRO,
  })
  @ApiQuery({ name: 'inicio', required: true, example: '2025-11-10' })
  @ApiQuery({ name: 'fin', required: true, example: '2025-11-16' })
  @ApiProduces('application/pdf')
  async vehiculoSemana(
    @Query('tipo') tipo: TipoVehiculo,
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Res() res: Response,
  ) {
    return this.reporteService.descargarReporteVehiculoPorSemana(
      tipo,
      inicio,
      fin,
      res,
    );
  }

  @Get('vehiculo/mes')
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.SUPERUSUARIO,
    RolUsuario.SUPERVISOR,
  )
  @ApiOperation({ summary: 'Reporte por tipo de vehículo por mes' })
  @ApiQuery({
    name: 'tipo',
    required: true,
    enum: TipoVehiculo,
    example: TipoVehiculo.MOTO,
  })
  @ApiQuery({ name: 'anio', required: true, example: 2025 })
  @ApiQuery({ name: 'mes', required: true, example: 11 })
  @ApiProduces('application/pdf')
  async vehiculoMes(
    @Query('tipo') tipo: TipoVehiculo,
    @Query('anio') anio: string,
    @Query('mes') mes: string,
    @Res() res: Response,
  ) {
    return this.reporteService.descargarReporteVehiculoPorMes(
      tipo,
      +anio,
      +mes,
      res,
    );
  }
}
