import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registro } from './entities/registro.entity';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReporteService {
  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
  ) {}

  async obtenerReporteCarrosPorFecha(
    fecha: string,
  ): Promise<{ entradas: Registro[]; salidas: Registro[] }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo: 'CARRO' })
      .andWhere('DATE("r"."horaEntrada") = :fecha', { fecha })
      .orderBy('"r"."horaEntrada"', 'ASC')
      .getMany();

    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo: 'CARRO' })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") = :fecha', { fecha })
      .orderBy('"r"."horaSalida"', 'ASC')
      .getMany();

    return { entradas, salidas };
  }

  async obtenerReporteParqueaderoPorSemana(
    inicio: string,
    fin: string,
  ): Promise<{ entradas: number; salidas: number }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .where('DATE("r"."horaEntrada") BETWEEN :inicio AND :fin', {
        inicio,
        fin,
      })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") BETWEEN :inicio AND :fin', {
        inicio,
        fin,
      })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReporteParqueaderoPorMes(
    anio: number,
    mes: number,
  ): Promise<{ entradas: number; salidas: number }> {
    const m = mes.toString().padStart(2, '0');
    const inicio = `${anio}-${m}-01`;
    const nextMonth = mes === 12 ? 1 : mes + 1;
    const nextYear = mes === 12 ? anio + 1 : anio;
    const fin = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaEntrada" >= :inicio AND "r"."horaEntrada" < :fin', {
        inicio,
        fin,
      })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaSalida" IS NOT NULL')
      .andWhere('"r"."horaSalida" >= :inicio AND "r"."horaSalida" < :fin', {
        inicio,
        fin,
      })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReportePorTipoVehiculoSemana(
    tipo: TipoVehiculo,
    inicio: string,
    fin: string,
  ): Promise<{ entradas: number; salidas: number }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('DATE("r"."horaEntrada") BETWEEN :inicio AND :fin', {
        inicio,
        fin,
      })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") BETWEEN :inicio AND :fin', {
        inicio,
        fin,
      })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReportePorTipoVehiculoMes(
    tipo: TipoVehiculo,
    anio: number,
    mes: number,
  ): Promise<{ entradas: number; salidas: number }> {
    const m = mes.toString().padStart(2, '0');
    const inicio = `${anio}-${m}-01`;
    const nextMonth = mes === 12 ? 1 : mes + 1;
    const nextYear = mes === 12 ? anio + 1 : anio;
    const fin = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaEntrada" >= :inicio AND "r"."horaEntrada" < :fin', {
        inicio,
        fin,
      })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('"r"."horaSalida" >= :inicio AND "r"."horaSalida" < :fin', {
        inicio,
        fin,
      })
      .getCount();
    return { entradas, salidas };
  }

  private static generateSimplePdf(title: string, lines: string[]): string {
    const esc = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const parts: string[] = [];
    const offsets: number[] = [];
    const len = () => parts.join('').length;
    const add = (s: string) => {
      offsets.push(len());
      parts.push(s);
    };
    parts.push('%PDF-1.4\n');
    add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    add(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    );
    const linesOps: string[] = [];
    linesOps.push('BT');
    linesOps.push('/F1 12 Tf');
    linesOps.push('14 TL');
    linesOps.push('1 0 0 1 72 760 Tm');
    linesOps.push(`(${esc(title)}) Tj`);
    for (const line of lines) {
      linesOps.push('T*');
      linesOps.push(`(${esc(line)}) Tj`);
    }
    linesOps.push('ET');
    const stream = linesOps.join('\n') + '\n';
    add(
      `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`,
    );
    add(
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    );
    const body = parts.join('');
    const xrefStart = body.length;
    const entries = ['0000000000 65535 f \n'];
    for (const off of offsets) {
      entries.push(`${off.toString().padStart(10, '0')} 00000 n \n`);
    }
    const xref =
      `xref\n0 ${offsets.length + 1}\n` +
      entries.join('') +
      `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    return body + xref;
  }

  private writeAndDownload(
    res: Response,
    title: string,
    lines: string[],
    filename: string,
  ) {
    const pdf = ReporteService.generateSimplePdf(title, lines);
    const dir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdf, 'binary');
    return res.download(filePath);
  }

  async descargarReporteCarrosPorFecha(fecha: string, res: Response) {
    const { entradas, salidas } =
      await this.obtenerReporteCarrosPorFecha(fecha);
    const title = `Reporte de carros ${fecha}`;
    const lines: string[] = [];
    lines.push(`Entradas: ${entradas.length}`);
    for (const e of entradas) {
      const vh = e.vehiculo as any;
      const he = new Date(e.horaEntrada).toISOString().substring(11, 19);
      lines.push(
        `${he} ${e.vehiculoPlaca} (${vh?.tipo ?? ''} ${vh?.marca ?? ''} ${vh?.modelo ?? ''} ${vh?.color ?? ''})`,
      );
    }
    lines.push(`Salidas: ${salidas.length}`);
    for (const s of salidas) {
      const vh = s.vehiculo as any;
      const hs = s.horaSalida
        ? new Date(s.horaSalida).toISOString().substring(11, 19)
        : '';
      lines.push(
        `${hs} ${s.vehiculoPlaca} (${vh?.tipo ?? ''} ${vh?.marca ?? ''} ${vh?.modelo ?? ''} ${vh?.color ?? ''})`,
      );
    }
    return this.writeAndDownload(res, title, lines, `reporte-${fecha}.pdf`);
  }

  async descargarReporteParqueaderoPorSemana(
    inicio: string,
    fin: string,
    res: Response,
  ) {
    const r = await this.obtenerReporteParqueaderoPorSemana(inicio, fin);
    const title = `Parqueadero semana ${inicio} a ${fin}`;
    return this.writeAndDownload(
      res,
      title,
      [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`],
      `reporte-parqueadero-semana-${inicio}-${fin}.pdf`,
    );
  }

  async descargarReporteParqueaderoPorMes(
    anio: number,
    mes: number,
    res: Response,
  ) {
    const r = await this.obtenerReporteParqueaderoPorMes(anio, mes);
    const title = `Parqueadero mes ${anio}-${mes.toString().padStart(2, '0')}`;
    return this.writeAndDownload(
      res,
      title,
      [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`],
      `reporte-parqueadero-mes-${anio}-${mes.toString().padStart(2, '0')}.pdf`,
    );
  }

  async descargarReporteVehiculoPorSemana(
    tipo: TipoVehiculo,
    inicio: string,
    fin: string,
    res: Response,
  ) {
    const r = await this.obtenerReportePorTipoVehiculoSemana(tipo, inicio, fin);
    const title = `Vehículo ${tipo} semana ${inicio} a ${fin}`;
    return this.writeAndDownload(
      res,
      title,
      [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`],
      `reporte-vehiculo-${tipo}-semana-${inicio}-${fin}.pdf`,
    );
  }

  async descargarReporteVehiculoPorMes(
    tipo: TipoVehiculo,
    anio: number,
    mes: number,
    res: Response,
  ) {
    const r = await this.obtenerReportePorTipoVehiculoMes(tipo, anio, mes);
    const title = `Vehículo ${tipo} mes ${anio}-${mes.toString().padStart(2, '0')}`;
    return this.writeAndDownload(
      res,
      title,
      [`Entradas: ${r.entradas}`, `Salidas: ${r.salidas}`],
      `reporte-vehiculo-${tipo}-mes-${anio}-${mes.toString().padStart(2, '0')}.pdf`,
    );
  }
}
