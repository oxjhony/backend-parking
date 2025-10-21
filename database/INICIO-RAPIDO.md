# 🚀 Guía Rápida - 5 Minutos

## Para empezar desde cero:

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Configurar variables de entorno
Edita el archivo `.env` en la raíz:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=admin1234
DATABASE_NAME=campus_parking
```

### 3️⃣ Crear base de datos
```bash
# Opción A: Con psql
psql -U postgres -h localhost -p 5433 -f database/setup.sql

# Opción B: Con pgAdmin
# 1. Abrir pgAdmin
# 2. Create Database → Nombre: campus_parking
```

### 4️⃣ Iniciar aplicación (crea las tablas automáticamente)
```bash
npm run start:dev
```

### 5️⃣ (Opcional) Insertar datos de prueba
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -f database/datos-prueba.sql
```

### 6️⃣ Probar
```bash
curl http://localhost:3000/conductor
```

---

## 🔧 Comandos Útiles

### Ver tablas
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -c "\dt"
```

### Ver estructura de tabla
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -c "\d conductores"
```

### Contar registros
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -c "SELECT COUNT(*) FROM conductores;"
```

### Eliminar y recrear todo
```bash
psql -U postgres -h localhost -p 5433 -f database/recreate.sql
npm run start:dev
```

---

## 📌 Estructura de Claves

### Conductores
- **PRIMARY KEY:** `codigo` (VARCHAR) - 10 dígitos
- Ejemplo: `0000028906`

### Vehículos
- **PRIMARY KEY:** `placa` (VARCHAR)
- **FOREIGN KEY:** `conductorCodigo` → `conductores.codigo`
- Ejemplo placa: `ABC123`

### Parqueaderos
- **PRIMARY KEY:** `id` (SERIAL - autogenerado)

---

## 🎯 Endpoints de la API

```bash
# CONDUCTORES
GET    /conductor           # Listar todos
GET    /conductor/:codigo   # Buscar por código
POST   /conductor           # Crear
PATCH  /conductor/:codigo   # Actualizar
DELETE /conductor/:codigo   # Eliminar

# VEHÍCULOS
GET    /vehiculo                      # Listar todos
GET    /vehiculo/:placa               # Buscar por placa
GET    /vehiculo/conductor/:codigo    # Buscar por conductor
POST   /vehiculo                      # Crear
PATCH  /vehiculo/:placa               # Actualizar
DELETE /vehiculo/:placa               # Eliminar

# PARQUEADEROS
GET    /parqueadero            # Listar todos
GET    /parqueadero/:id        # Buscar por ID
POST   /parqueadero            # Crear
PATCH  /parqueadero/:id        # Actualizar
PATCH  /parqueadero/:id/cupos  # Actualizar cupos
DELETE /parqueadero/:id        # Eliminar
```

---

## 📝 Ejemplo: Crear un conductor

```bash
curl -X POST http://localhost:3000/conductor \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "0000012345",
    "nombre": "Tu Nombre",
    "apellido": "Tu Apellido",
    "correo": "tu.correo@ucaldas.edu.co",
    "telefono": "3001234567"
  }'
```

## 📝 Ejemplo: Crear un vehículo

```bash
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "XYZ999",
    "tipo": "CARRO",
    "marca": "Toyota",
    "modelo": "Corolla",
    "color": "Azul",
    "fechaCaducidad": "2025-12-31",
    "conductorCodigo": "0000012345"
  }'
```

---

## ❓ ¿Algo no funciona?

1. Verifica que PostgreSQL esté corriendo
2. Revisa el archivo `.env`
3. Mira los logs de la aplicación
4. Consulta `database/README.md` para más detalles

---
