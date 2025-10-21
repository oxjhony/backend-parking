# Módulos del Sistema CampusParking UC

Este documento describe los módulos implementados para el sistema de gestión de parqueaderos.

## Módulos Implementados

### 1. Módulo Conductor

**Entidad:** `Conductor`
- `codigo`: string (PRIMARY KEY) - Código único del conductor (10 dígitos)
- `nombre`: string - Nombre del conductor
- `apellido`: string - Apellido del conductor
- `correo`: string (UNIQUE) - Correo electrónico institucional (@ucaldas.edu.co)
- `telefono`: string - Número de teléfono celular
- `vehiculos`: Vehiculo[] (opcional) - Relación con vehículos

**Endpoints:**
- `POST /conductor` - Crear un nuevo conductor
- `GET /conductor` - Obtener todos los conductores
- `GET /conductor/:codigo` - Obtener un conductor por código
- `PATCH /conductor/:codigo` - Actualizar un conductor
- `DELETE /conductor/:codigo` - Eliminar un conductor

**Ejemplo de creación:**
```json
{
  "codigo": "0000012345",
  "nombre": "Juan Carlos",
  "apellido": "Pérez González",
  "correo": "juan.perez@ucaldas.edu.co",
  "telefono": "3101234567"
}
```

---

### 2. Módulo Vehículo

**Entidad:** `Vehiculo`
- `placa`: string (PRIMARY KEY) - Placa del vehículo (identificador único)
- `tipo`: TipoVehiculo - Tipo de vehículo (CARRO o MOTO)
- `marca`: string - Marca del vehículo
- `modelo`: string - Modelo del vehículo
- `color`: string - Color del vehículo
- `fechaCaducidad`: Date - Fecha de caducidad del permiso
- `conductorCodigo`: string (FOREIGN KEY) - Código del conductor propietario
- `conductor`: Conductor (opcional) - Relación con el conductor

**Enumeración TipoVehiculo:**
- `CARRO`
- `MOTO`

**Endpoints:**
- `POST /vehiculo` - Crear un nuevo vehículo
- `GET /vehiculo` - Obtener todos los vehículos
- `GET /vehiculo/:placa` - Obtener un vehículo por placa
- `GET /vehiculo/conductor/:conductorCodigo` - Obtener vehículos por conductor
- `PATCH /vehiculo/:placa` - Actualizar un vehículo
- `DELETE /vehiculo/:placa` - Eliminar un vehículo

**Ejemplo de creación:**
```json
{
  "placa": "ABC123",
  "tipo": "CARRO",
  "marca": "Toyota",
  "modelo": "Corolla 2020",
  "color": "Rojo",
  "fechaCaducidad": "2025-12-31",
  "conductorCodigo": "0000012345"
}
```

---

### 3. Módulo Parqueadero

**Entidad:** `Parqueadero`
- `id`: number - Identificador único
- `nombre`: string - Nombre del parqueadero
- `direccion`: string - Dirección del parqueadero
- `capacidad`: number - Capacidad total de cupos
- `cuposDisponibles`: number - Cupos disponibles actuales

**Endpoints:**
- `POST /parqueadero` - Crear un nuevo parqueadero
- `GET /parqueadero` - Obtener todos los parqueaderos
- `GET /parqueadero/:id` - Obtener un parqueadero por ID
- `PATCH /parqueadero/:id` - Actualizar un parqueadero
- `PATCH /parqueadero/:id/cupos` - Actualizar cupos disponibles (incremento/decremento)
- `DELETE /parqueadero/:id` - Eliminar un parqueadero

**Ejemplo de creación:**
```json
{
  "nombre": "Parqueadero Principal",
  "direccion": "Calle 123 #45-67",
  "capacidad": 100,
  "cuposDisponibles": 100
}
```

**Ejemplo de actualización de cupos:**
```json
{
  "incremento": -1  // Decrementar en 1 (entrada de vehículo)
}
```

```json
{
  "incremento": 1  // Incrementar en 1 (salida de vehículo)
}
```

---

## Validaciones Implementadas

### Conductor
- Todos los campos son obligatorios
- El correo debe tener formato válido

### Vehículo
- Todos los campos son obligatorios
- El tipo debe ser CARRO o MOTO
- La fecha de caducidad debe ser en formato ISO 8601
- El conductorId debe ser un número entero

### Parqueadero
- Todos los campos son obligatorios
- La capacidad debe ser mayor o igual a 1
- Los cupos disponibles no pueden exceder la capacidad
- Los cupos disponibles no pueden ser negativos

---

## Relaciones entre Entidades

```
Conductor (1) ----< (N) Vehiculo
```

Un conductor puede tener múltiples vehículos asociados.

---

## Estructura de Archivos por Módulo

Cada módulo sigue la siguiente estructura:

```
src/
  [modulo]/
    ├── dto/
    │   ├── create-[modulo].dto.ts
    │   └── update-[modulo].dto.ts
    ├── entities/
    │   └── [modulo].entity.ts
    ├── enums/ (solo en vehiculo)
    │   └── tipo-vehiculo.enum.ts
    ├── [modulo].controller.ts
    ├── [modulo].module.ts
    ├── [modulo].service.ts
    └── index.ts
```

---

## Notas Técnicas

- Todos los módulos utilizan almacenamiento en memoria
- Los IDs se generan automáticamente de forma incremental
- Los servicios incluyen manejo de errores con excepciones de NestJS
- Se implementó validación de datos con class-validator
- Los DTOs de actualización usan PartialType para hacer todos los campos opcionales

---

