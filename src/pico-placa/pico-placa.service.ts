import { Injectable, Logger } from '@nestjs/common';
import { ValidarPicoPlacaDto } from './dto/validar-pico-placa.dto';
import { PicoPlacaResponseDto } from './dto/pico-placa-response.dto';
import {
  RESTRICCIONES_PICO_PLACA,
  HORARIO_RESTRICCION,
  NOMBRES_DIAS,
} from './constants/pico-placa.constants';
import { DiaSemana } from './enums/dia-semana.enum';

@Injectable()
export class PicoPlacaService {
  private readonly logger = new Logger(PicoPlacaService.name);

  /**
   * Valida si una placa tiene restricción de pico y placa
   * @param validarDto - DTO con la placa y opcionalmente la fecha/hora
   * @returns Información completa sobre la restricción
   */
  validarPicoPlaca(validarDto: ValidarPicoPlacaDto): PicoPlacaResponseDto {
    const { placa, fechaHora } = validarDto;

    // Usar fecha proporcionada o fecha actual
    const fechaValidacion = fechaHora ? new Date(fechaHora) : new Date();

    // Extraer información de fecha y hora
    const diaSemana = fechaValidacion.getDay() as DiaSemana;
    const hora = fechaValidacion.getHours();

    // Obtener último dígito de la placa
    const ultimoDigito = this.obtenerUltimoDigito(placa);

    // Validar si está dentro del horario de restricción
    const dentroHorario = this.estaEnHorarioRestriccion(hora);

    // Obtener dígitos restringidos para el día
    const digitosRestringidos = RESTRICCIONES_PICO_PLACA[diaSemana];

    // Determinar si tiene restricción
    const tieneRestriccion =
      dentroHorario &&
      digitosRestringidos.length > 0 &&
      digitosRestringidos.includes(ultimoDigito);

    // Generar mensaje descriptivo
    const mensaje = this.generarMensaje(
      placa,
      tieneRestriccion,
      diaSemana,
      dentroHorario,
      digitosRestringidos,
    );

    // Log si se detecta restricción
    if (tieneRestriccion) {
      this.logger.warn(
        `⚠️ Restricción detectada - Placa: ${placa}, Día: ${NOMBRES_DIAS[diaSemana]}, Hora: ${hora}:00`,
      );
    }

    return {
      tieneRestriccion,
      placa: placa.toUpperCase(),
      ultimoDigito,
      diaSemana: NOMBRES_DIAS[diaSemana],
      hora,
      dentroHorario,
      digitosRestringidos,
      mensaje,
      fechaValidacion,
    };
  }

  /**
   * Extrae el último dígito de una placa
   * Maneja placas que terminan en letra convirtiéndola a 0
   * @param placa - Placa del vehículo
   * @returns Último dígito numérico
   */
  private obtenerUltimoDigito(placa: string): number {
    const ultimoCaracter = placa.charAt(placa.length - 1);
    const digito = parseInt(ultimoCaracter, 10);

    // Si el último caracter es letra, considerar como 0
    return isNaN(digito) ? 0 : digito;
  }

  /**
   * Verifica si una hora está dentro del rango de restricción
   * @param hora - Hora en formato 24h
   * @returns true si está dentro del horario de restricción
   */
  private estaEnHorarioRestriccion(hora: number): boolean {
    return (
      hora >= HORARIO_RESTRICCION.HORA_INICIO &&
      hora < HORARIO_RESTRICCION.HORA_FIN
    );
  }

  /**
   * Genera un mensaje descriptivo del resultado de la validación
   */
  private generarMensaje(
    placa: string,
    tieneRestriccion: boolean,
    diaSemana: DiaSemana,
    dentroHorario: boolean,
    digitosRestringidos: number[],
  ): string {
    const nombreDia = NOMBRES_DIAS[diaSemana];
    const placaMayus = placa.toUpperCase();

    if (tieneRestriccion) {
      return `⚠️ La placa ${placaMayus} tiene restricción de pico y placa el día ${nombreDia} entre las ${HORARIO_RESTRICCION.HORA_INICIO}:00 y ${HORARIO_RESTRICCION.HORA_FIN}:00. Dígitos restringidos: ${digitosRestringidos.join(', ')}.`;
    }

    if (digitosRestringidos.length === 0) {
      return `✓ La placa ${placaMayus} NO tiene restricción. Los días ${nombreDia} no hay pico y placa.`;
    }

    if (!dentroHorario) {
      return `✓ La placa ${placaMayus} NO tiene restricción en este horario. Las restricciones aplican de ${HORARIO_RESTRICCION.HORA_INICIO}:00 a ${HORARIO_RESTRICCION.HORA_FIN}:00.`;
    }

    return `✓ La placa ${placaMayus} NO tiene restricción el día ${nombreDia}. Dígitos restringidos hoy: ${digitosRestringidos.join(', ')}.`;
  }

  /**
   * Valida si una placa puede ingresar al parqueadero
   * Método de conveniencia que retorna solo true/false
   * @param placa - Placa del vehículo
   * @param fechaHora - Fecha/hora opcional para validar
   * @returns true si puede ingresar, false si tiene restricción
   */
  puedeIngresar(placa: string, fechaHora?: Date): boolean {
    const resultado = this.validarPicoPlaca({
      placa,
      fechaHora: fechaHora?.toISOString(),
    });

    return !resultado.tieneRestriccion;
  }
}
