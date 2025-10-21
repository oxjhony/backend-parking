# Script de Prueba - API CampusParking

Este archivo contiene ejemplos de cURL para probar los endpoints de la API.

## Prerequisitos

Asegúrate de que el servidor esté corriendo:
```bash
npm run start:dev
```

---

## 1. Conductor

### Crear un conductor
```bash
curl -X POST http://localhost:3000/conductor \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "0000012345",
    "nombre": "Juan Carlos",
    "apellido": "Pérez González",
    "correo": "juan.perez@ucaldas.edu.co",
    "telefono": "3101234567"
  }'
```

### Crear otro conductor
```bash
curl -X POST http://localhost:3000/conductor \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "0000054321",
    "nombre": "María Fernanda",
    "apellido": "García López",
    "correo": "maria.garcia@ucaldas.edu.co",
    "telefono": "3209876543"
  }'
```

### Obtener todos los conductores
```bash
curl http://localhost:3000/conductor
```

### Obtener un conductor por código
```bash
curl http://localhost:3000/conductor/0000012345
```

### Actualizar un conductor
```bash
curl -X PATCH http://localhost:3000/conductor/0000012345 \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "3151234567"
  }'
```

### Eliminar un conductor
```bash
curl -X DELETE http://localhost:3000/conductor/0000012345
```

---

## 2. Vehículo

### Crear un vehículo (CARRO)
```bash
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "ABC123",
    "tipo": "CARRO",
    "marca": "Toyota",
    "modelo": "Corolla 2020",
    "color": "Rojo",
    "fechaCaducidad": "2025-12-31",
    "conductorCodigo": "0000012345"
  }'
```

### Crear un vehículo (MOTO)
```bash
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "XYZ789",
    "tipo": "MOTO",
    "marca": "Yamaha",
    "modelo": "FZ-16",
    "color": "Azul",
    "fechaCaducidad": "2025-06-30",
    "conductorCodigo": "0000012345"
  }'
```

### Obtener todos los vehículos
```bash
curl http://localhost:3000/vehiculo
```

### Obtener un vehículo por placa
```bash
curl http://localhost:3000/vehiculo/ABC123
```

### Obtener vehículos por conductor
```bash
curl http://localhost:3000/vehiculo/conductor/0000012345
```

### Actualizar un vehículo
```bash
curl -X PATCH http://localhost:3000/vehiculo/ABC123 \
  -H "Content-Type: application/json" \
  -d '{
    "color": "Negro"
  }'
```

### Eliminar un vehículo
```bash
curl -X DELETE http://localhost:3000/vehiculo/ABC123
```

---

## 3. Parqueadero

### Crear un parqueadero
```bash
curl -X POST http://localhost:3000/parqueadero \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Parqueadero Principal",
    "direccion": "Calle 123 #45-67",
    "capacidad": 100,
    "cuposDisponibles": 100
  }'
```

### Crear otro parqueadero
```bash
curl -X POST http://localhost:3000/parqueadero \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Parqueadero Auxiliar",
    "direccion": "Carrera 50 #25-30",
    "capacidad": 50,
    "cuposDisponibles": 50
  }'
```

### Obtener todos los parqueaderos
```bash
curl http://localhost:3000/parqueadero
```

### Obtener un parqueadero por ID
```bash
curl http://localhost:3000/parqueadero/1
```

### Actualizar un parqueadero
```bash
curl -X PATCH http://localhost:3000/parqueadero/1 \
  -H "Content-Type: application/json" \
  -d '{
    "capacidad": 120,
    "cuposDisponibles": 120
  }'
```

### Actualizar cupos disponibles (entrada de vehículo)
```bash
curl -X PATCH http://localhost:3000/parqueadero/1/cupos \
  -H "Content-Type: application/json" \
  -d '{
    "incremento": -1
  }'
```

### Actualizar cupos disponibles (salida de vehículo)
```bash
curl -X PATCH http://localhost:3000/parqueadero/1/cupos \
  -H "Content-Type: application/json" \
  -d '{
    "incremento": 1
  }'
```

### Eliminar un parqueadero
```bash
curl -X DELETE http://localhost:3000/parqueadero/1
```

---

## Flujo de Prueba Completo

```bash
# 1. Crear un conductor
curl -X POST http://localhost:3000/conductor \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Pérez", "codigo": "EST001", "correo": "juan.perez@example.com"}'

# 2. Crear un parqueadero
curl -X POST http://localhost:3000/parqueadero \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Parqueadero Principal", "direccion": "Calle 123 #45-67", "capacidad": 100, "cuposDisponibles": 100}'

# 3. Crear un vehículo asociado al conductor
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{"placa": "ABC123", "tipo": "CARRO", "marca": "Toyota", "modelo": "Corolla", "color": "Rojo", "fechaCaducidad": "2025-12-31T00:00:00.000Z", "conductorId": 1}'

# 4. Simular entrada de vehículo (reducir cupos)
curl -X PATCH http://localhost:3000/parqueadero/1/cupos \
  -H "Content-Type: application/json" \
  -d '{"incremento": -1}'

# 5. Ver estado del parqueadero
curl http://localhost:3000/parqueadero/1

# 6. Simular salida de vehículo (aumentar cupos)
curl -X PATCH http://localhost:3000/parqueadero/1/cupos \
  -H "Content-Type: application/json" \
  -d '{"incremento": 1}'

# 7. Ver estado final del parqueadero
curl http://localhost:3000/parqueadero/1
```

---

## Validaciones de Error

### Error: Cupos disponibles mayores a capacidad
```bash
curl -X POST http://localhost:3000/parqueadero \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Parqueadero Test",
    "direccion": "Test",
    "capacidad": 50,
    "cuposDisponibles": 60
  }'
```

### Error: Tipo de vehículo inválido
```bash
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "TEST123",
    "tipo": "CAMION",
    "marca": "Test",
    "modelo": "Test",
    "color": "Test",
    "fechaCaducidad": "2025-12-31T00:00:00.000Z",
    "conductorId": 1
  }'
```

### Error: Vehículo no encontrado
```bash
curl http://localhost:3000/vehiculo/999
```

### Error: No hay cupos disponibles
```bash
# Primero crear un parqueadero con 0 cupos
curl -X POST http://localhost:3000/parqueadero \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Parqueadero Lleno", "direccion": "Test", "capacidad": 10, "cuposDisponibles": 0}'

# Intentar reducir cupos
curl -X PATCH http://localhost:3000/parqueadero/2/cupos \
  -H "Content-Type: application/json" \
  -d '{"incremento": -1}'
```
