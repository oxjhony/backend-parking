# Módulo de Validación de Pico y Placa

## 📋 Descripción

Módulo que implementa la validación automática de restricciones de pico y placa para el sistema CampusParking. Permite alertar al guardia cuando un vehículo intenta ingresar con restricción activa.

## 🎯 Objetivos

- Validar automáticamente si una placa tiene restricción de pico y placa
- Bloquear el registro de entrada cuando hay restricción activa
- Proporcionar retroalimentación clara sobre las restricciones
- Cumplir con las reglas institucionales de pico y placa

## 📅 Reglas de Pico y Placa

### Restricción por Día de la Semana

| Día | Dígitos Restringidos |
|-----|---------------------|
| Lunes | 1, 2 |
| Martes | 3, 4 |
| Miércoles | 5, 6 |
| Jueves | 7, 8 |
| Viernes | 9, 0 |
| Sábado | Sin restricción |
| Domingo | Sin restricción |

### Horario de Restricción

- **Hora de inicio:** 6:00 AM
- **Hora de fin:** 8:00 PM (20:00)

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/pico-placa/
├── constants/
│   └── pico-placa.constants.ts    # Configuración de restricciones
├── dto/
│   ├── validar-pico-placa.dto.ts  # DTO de entrada
│   └── pico-placa-response.dto.ts # DTO de respuesta
├── enums/
│   └── dia-semana.enum.ts         # Enum de días de la semana
├── pico-placa.controller.ts       # Controlador REST
├── pico-placa.service.ts          # Lógica de negocio
├── pico-placa.service.spec.ts     # Pruebas unitarias
├── pico-placa.module.ts           # Módulo NestJS
└── index.ts                       # Exportaciones
```

## 🔌 API Endpoints

### POST /pico-placa/validar

Valida si una placa tiene restricción de pico y placa activa.

**Autenticación:** Bearer Token (JWT)  
**Roles permitidos:** Vigilante, Administrador, Superusuario

#### Request Body

```json
{
  "placa": "ABC123",
  "fechaHora": "2025-11-18T14:30:00.000Z" // Opcional
}
```

#### Response 200 OK

```json
{
  "tieneRestriccion": true,
  "placa": "ABC123",
  "ultimoDigito": 3,
  "diaSemana": "Martes",
  "hora": 14,
  "dentroHorario": true,
  "digitosRestringidos": [3, 4],
  "mensaje": "⚠️ La placa ABC123 tiene restricción de pico y placa el día Martes entre las 6:00 y 20:00. Dígitos restringidos: 3, 4.",
  "fechaValidacion": "2025-11-18T14:30:00.000Z"
}
```

#### Response 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Formato de placa inválido. Debe seguir el formato colombiano (ej: ABC123)"],
  "error": "Bad Request"
}
```

## 🔄 Integración con Módulo de Registro

El servicio de pico y placa está integrado en el flujo de registro de entrada de vehículos:

1. El vigilante intenta registrar la entrada de un vehículo
2. El sistema valida formato, existencia, capacidad y duplicados
3. **Se valida pico y placa** usando `PicoPlacaService`
4. Si hay restricción activa, se rechaza el registro con mensaje claro
5. Si no hay restricción, se permite el ingreso normalmente

### Ejemplo de Error por Pico y Placa

```json
{
  "statusCode": 400,
  "message": "No se puede registrar el ingreso del vehículo",
  "restriccion": "⚠️ La placa ABC123 tiene restricción de pico y placa el día Martes entre las 6:00 y 20:00. Dígitos restringidos: 3, 4.",
  "detalles": {
    "placa": "ABC123",
    "diaSemana": "Martes",
    "digitosRestringidos": [3, 4]
  }
}
```

## 🧪 Pruebas

### Pruebas Unitarias

**Archivo:** `src/pico-placa/pico-placa.service.spec.ts`  
**Cobertura:** 31 casos de prueba

```bash
npm test -- pico-placa.service.spec.ts
```

**Casos cubiertos:**
- ✅ Validación por día de la semana (Lunes a Viernes)
- ✅ Sin restricciones en fin de semana
- ✅ Validación de horarios (6 AM - 8 PM)
- ✅ Casos especiales de placas (terminadas en letra)
- ✅ Método `puedeIngresar()`
- ✅ Mensajes descriptivos

### Pruebas E2E

**Archivo:** `test/pico-placa.e2e-spec.ts`

```bash
npm run test:e2e -- pico-placa.e2e-spec.ts
```

**Casos cubiertos:**
- ✅ Endpoint de validación
- ✅ Integración con registro de entrada
- ✅ Autenticación y autorización
- ✅ Validación de formato de placa
- ✅ Estructura de respuesta

## 💻 Uso del Servicio

### Inyectar en un Módulo

```typescript
import { PicoPlacaModule } from '../pico-placa/pico-placa.module';

@Module({
  imports: [PicoPlacaModule],
  // ...
})
export class MiModulo {}
```

### Usar en un Servicio

```typescript
import { PicoPlacaService } from '../pico-placa/pico-placa.service';

export class MiServicio {
  constructor(private readonly picoPlacaService: PicoPlacaService) {}

  validarIngreso(placa: string) {
    // Validación completa
    const resultado = this.picoPlacaService.validarPicoPlaca({ placa });
    
    if (resultado.tieneRestriccion) {
      throw new BadRequestException(resultado.mensaje);
    }

    // O simplemente verificar si puede ingresar
    const puedeIngresar = this.picoPlacaService.puedeIngresar(placa);
    
    if (!puedeIngresar) {
      throw new BadRequestException('Vehículo con restricción de pico y placa');
    }
  }
}
```

## 🔧 Configuración

Las reglas de pico y placa se encuentran en:  
`src/pico-placa/constants/pico-placa.constants.ts`

### Modificar Restricciones

```typescript
export const RESTRICCIONES_PICO_PLACA: Record<DiaSemana, number[]> = {
  [DiaSemana.LUNES]: [1, 2],      // Modificar dígitos
  [DiaSemana.MARTES]: [3, 4],
  // ...
};
```

### Modificar Horario

```typescript
export const HORARIO_RESTRICCION = {
  HORA_INICIO: 6,  // Cambiar hora de inicio
  HORA_FIN: 20,    // Cambiar hora de fin
};
```

## 📊 Logs

El servicio registra logs cuando detecta una restricción:

```
[PicoPlacaService] ⚠️ Restricción detectada - Placa: ABC123, Día: Martes, Hora: 14:00
[RegistroService] ⚠️ Intento de ingreso con restricción de pico y placa: ...
```

## 🚀 Características Implementadas

- ✅ Validación por día de la semana
- ✅ Validación por horario (6 AM - 8 PM)
- ✅ Soporte para placas terminadas en letra (consideradas como 0)
- ✅ Mensajes descriptivos y claros
- ✅ Integración con módulo de registro
- ✅ Endpoint REST para validación independiente
- ✅ Documentación Swagger/OpenAPI
- ✅ Pruebas unitarias completas (31 tests)
- ✅ Pruebas E2E
- ✅ Logs de auditoría
- ✅ Respuestas estructuradas con detalles completos

## 📝 Casos Especiales

### Placas que Terminan en Letra

Las placas que terminan en letra (ej: `ABC12A`) se consideran con dígito final `0` para efectos de pico y placa.

### Validación sin Fecha

Si no se proporciona `fechaHora`, el sistema usa la fecha y hora actual del servidor.

### Días sin Restricción

Los sábados y domingos **NO** tienen restricciones de pico y placa.

## 🔒 Seguridad

- Requiere autenticación JWT
- Control de acceso por roles (Guards)
- Validación de entrada con class-validator
- Sanitización de datos

## 📚 Referencias

- [NestJS Documentation](https://docs.nestjs.com)
- [Swagger/OpenAPI](https://swagger.io)
- [Jest Testing](https://jestjs.io)

---

**Versión:** 1.0.0  
**Fecha de implementación:** Noviembre 18, 2025  
**Autor:** Backend Team - CampusParking
