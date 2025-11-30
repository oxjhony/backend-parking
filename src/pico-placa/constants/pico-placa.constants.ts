import { DiaSemana } from '../enums/dia-semana.enum';

/**
 * Configuración de restricciones de pico y placa
 * 
 * Reglas institucionales:
 * - Lunes: Placas terminadas en 1 y 2
 * - Martes: Placas terminadas en 3 y 4
 * - Miércoles: Placas terminadas en 5 y 6
 * - Jueves: Placas terminadas en 7 y 8
 * - Viernes: Placas terminadas en 9 y 0
 * - Sábado y Domingo: Sin restricciones
 */
export const RESTRICCIONES_PICO_PLACA: Record<DiaSemana, number[]> = {
  [DiaSemana.DOMINGO]: [], // Sin restricciones
  [DiaSemana.LUNES]: [1, 2],
  [DiaSemana.MARTES]: [3, 4],
  [DiaSemana.MIERCOLES]: [5, 6],
  [DiaSemana.JUEVES]: [7, 8],
  [DiaSemana.VIERNES]: [9, 0],
  [DiaSemana.SABADO]: [], // Sin restricciones
};

/**
 * Horario de aplicación de pico y placa
 * Formato 24 horas
 */
export const HORARIO_RESTRICCION = {
  HORA_INICIO: 6, // 6:00 AM
  HORA_FIN: 20,   // 8:00 PM (20:00)
};

/**
 * Días de la semana en formato texto
 */
export const NOMBRES_DIAS: Record<DiaSemana, string> = {
  [DiaSemana.DOMINGO]: 'Domingo',
  [DiaSemana.LUNES]: 'Lunes',
  [DiaSemana.MARTES]: 'Martes',
  [DiaSemana.MIERCOLES]: 'Miércoles',
  [DiaSemana.JUEVES]: 'Jueves',
  [DiaSemana.VIERNES]: 'Viernes',
  [DiaSemana.SABADO]: 'Sábado',
};
