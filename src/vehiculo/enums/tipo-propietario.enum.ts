/**
 * Enumera los tipos de propietario de un vehículo.
 * Utilizado como discriminador para relaciones polimórficas.
 */
export enum TipoPropietario {
  /**
   * Vehículo pertenece a un conductor institucional (tabla conductores)
   */
  INSTITUCIONAL = 'INSTITUCIONAL',

  /**
   * Vehículo pertenece a un visitante (tabla visitantes_conductores)
   */
  VISITANTE = 'VISITANTE',
}
