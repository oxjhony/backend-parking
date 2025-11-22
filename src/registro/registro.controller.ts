import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiProduces,
} from '@nestjs/swagger';
import { RegistroService } from './registro.service';
import { Response } from 'express';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuario/enums/rol-usuario.enum';
import { EstadoRegistro } from './enums/estado-registro.enum';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('registro')
@Controller('registro')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Post()
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar entrada de vehículo al parqueadero' })
  @ApiBody({ type: CreateRegistroDto })
  @ApiResponse({ status: 201, description: 'Entrada registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'No hay cupos disponibles o vehículo ya tiene registro activo.' })
  @ApiResponse({ status: 404, description: 'Vehículo, usuario o parqueadero no encontrado.' })
  create(@Body() createRegistroDto: CreateRegistroDto) {
    return this.registroService.create(createRegistroDto);
  }

  @Patch(':id/salida')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar salida de vehículo del parqueadero' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: RegistrarSalidaDto, required: false })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El registro ya está cerrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  registrarSalida(
    @Param('id') id: string,
    @Body() registrarSalidaDto?: RegistrarSalidaDto,
  ) {
    return this.registroService.registrarSalida(+id, registrarSalidaDto);
  }

  @Patch('vehiculo/:placa/salida')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar salida por placa de vehículo' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiBody({ type: RegistrarSalidaDto, required: false })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El registro ya está cerrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  async registrarSalidaPorPlaca(
    @Param('placa') placa: string,
    @Body() registrarSalidaDto?: RegistrarSalidaDto,
  ) {
    // Buscar registro activo por placa
    const registros = await this.registroService.findByVehiculo(placa);
    const registroActivo = registros.find(r => r.estado === EstadoRegistro.ACTIVO);
    if (!registroActivo) {
      // No hay registro activo con esa placa
      throw new NotFoundException('Registro activo para la placa no encontrado');
    }

    return this.registroService.registrarSalida(registroActivo.id, registrarSalidaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los registros' })
  @ApiResponse({ status: 200, description: 'Listado de registros.' })
  findAll() {
    return this.registroService.findAll();
  }

  @Get('estado/:estado')
  @ApiOperation({ summary: 'Listar registros por estado' })
  @ApiParam({ name: 'estado', enum: EstadoRegistro, example: EstadoRegistro.ACTIVO })
  @ApiResponse({ status: 200, description: 'Registros encontrados por estado.' })
  findByEstado(@Param('estado') estado: EstadoRegistro) {
    return this.registroService.findByEstado(estado);
  }

  @Get('vehiculo/:placa')
  @ApiOperation({ summary: 'Listar registros por vehículo' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiResponse({ status: 200, description: 'Registros encontrados por vehículo.' })
  findByVehiculo(@Param('placa') placa: string) {
    return this.registroService.findByVehiculo(placa);
  }

  @Get('parqueadero/:id')
  @ApiOperation({ summary: 'Listar registros por parqueadero' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registros encontrados por parqueadero.' })
  findByParqueadero(@Param('id') id: string) {
    return this.registroService.findByParqueadero(+id);
  }

  @Get('usuario/:id')
  @ApiOperation({ summary: 'Listar registros por usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registros encontrados por usuario.' })
  findByUsuario(@Param('id') id: string) {
    return this.registroService.findByUsuario(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.registroService.findOne(+id);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Eliminar registro por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registro eliminado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  remove(@Param('id') id: string) {
    return this.registroService.remove(+id);
  }
}

@ApiTags('reporte')
@Controller('reporte')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReporteController {
  constructor(private readonly registroService: RegistroService) {}

  private static generateSimplePdf(title: string, lines: string[]): string {
    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const parts: string[] = [];
    const offsets: number[] = [];
    const len = () => parts.join('').length;
    const add = (s: string) => { offsets.push(len()); parts.push(s); };
    parts.push('%PDF-1.4\n');
    add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    add('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    const linesOps: string[] = [];
    linesOps.push('BT');
    linesOps.push('/F1 12 Tf');
    linesOps.push('14 TL');
    linesOps.push('1 0 0 1 72 760 Tm');
    linesOps.push(`(${esc(title)}) Tj`);
    for (const line of lines) { linesOps.push('T*'); linesOps.push(`(${esc(line)}) Tj`); }
    linesOps.push('ET');
    const stream = linesOps.join('\n') + '\n';
    add(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);
    add('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    const body = parts.join('');
    const xrefStart = body.length;
    const entries = ['0000000000 65535 f \n'];
    for (const off of offsets) { entries.push(`${off.toString().padStart(10, '0')} 00000 n \n`); }
    const xref = `xref\n0 ${offsets.length + 1}\n` + entries.join('') + `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    return body + xref;
  }

  private static writeAndDownload(res: Response, title: string, lines: string[], filename: string) {
    const pdf = ReporteController.generateSimplePdf(title, lines);
    const dir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdf, 'binary');
    return res.download(filePath);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Reporte PDF de carros por fecha' })
  @ApiQuery({ name: 'fecha', required: true, example: '2025-01-01' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF del reporte.', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } })
  async reportePdf(@Query('fecha') fecha: string, @Res() res: Response) {
    const { entradas, salidas } = await this.registroService.obtenerReporteCarrosPorFecha(fecha);
    const title = `Reporte de carros ${fecha}`;
    const lines: string[] = [];
    lines.push(`Entradas: ${entradas.length}`);
    lines.push(`Salidas: ${salidas.length}`);
    return ReporteController.writeAndDownload(res, title, lines, `reporte-${fecha}.pdf`);
  }

  @Get('parqueadero/semana')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Reporte del parqueadero por semana' })
  @ApiQuery({ name: 'inicio', required: true, example: '2025-11-10' })
  @ApiQuery({ name: 'fin', required: true, example: '2025-11-16' })
  @ApiProduces('application/pdf')
  async parqueaderoSemana(@Query('inicio') inicio: string, @Query('fin') fin: string, @Res() res: Response) {
    const r = await this.registroService.obtenerReporteParqueaderoPorSemana(inicio, fin);
    const title = `Parqueadero semana ${inicio} a ${fin}`;
    return ReporteController.writeAndDownload(res, title, [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`], `reporte-parqueadero-semana-${inicio}-${fin}.pdf`);
  }

  @Get('parqueadero/mes')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Reporte del parqueadero por mes' })
  @ApiQuery({ name: 'anio', required: true, example: 2025 })
  @ApiQuery({ name: 'mes', required: true, example: 11 })
  @ApiProduces('application/pdf')
  async parqueaderoMes(@Query('anio') anio: string, @Query('mes') mes: string, @Res() res: Response) {
    const r = await this.registroService.obtenerReporteParqueaderoPorMes(+anio, +mes);
    const title = `Parqueadero mes ${anio}-${mes.padStart(2, '0')}`;
    return ReporteController.writeAndDownload(res, title, [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`], `reporte-parqueadero-mes-${anio}-${mes.padStart(2, '0')}.pdf`);
  }

  @Get('vehiculo/semana')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Reporte por tipo de vehículo por semana' })
  @ApiQuery({ name: 'tipo', required: true, enum: TipoVehiculo, example: TipoVehiculo.CARRO })
  @ApiQuery({ name: 'inicio', required: true, example: '2025-11-10' })
  @ApiQuery({ name: 'fin', required: true, example: '2025-11-16' })
  @ApiProduces('application/pdf')
  async vehiculoSemana(@Query('tipo') tipo: TipoVehiculo, @Query('inicio') inicio: string, @Query('fin') fin: string, @Res() res: Response) {
    const r = await this.registroService.obtenerReportePorTipoVehiculoSemana(tipo, inicio, fin);
    const title = `Vehículo ${tipo} semana ${inicio} a ${fin}`;
    return ReporteController.writeAndDownload(res, title, [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`], `reporte-vehiculo-${tipo}-semana-${inicio}-${fin}.pdf`);
  }

  @Get('vehiculo/mes')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO, RolUsuario.SUPERVISOR)
  @ApiOperation({ summary: 'Reporte por tipo de vehículo por mes' })
  @ApiQuery({ name: 'tipo', required: true, enum: TipoVehiculo, example: TipoVehiculo.MOTO })
  @ApiQuery({ name: 'anio', required: true, example: 2025 })
  @ApiQuery({ name: 'mes', required: true, example: 11 })
  @ApiProduces('application/pdf')
  async vehiculoMes(@Query('tipo') tipo: TipoVehiculo, @Query('anio') anio: string, @Query('mes') mes: string, @Res() res: Response) {
    const r = await this.registroService.obtenerReportePorTipoVehiculoMes(tipo, +anio, +mes);
    const title = `Vehículo ${tipo} mes ${anio}-${mes.padStart(2, '0')}`;
    return ReporteController.writeAndDownload(res, title, [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`], `reporte-vehiculo-${tipo}-mes-${anio}-${mes.padStart(2, '0')}.pdf`);
  }
}
