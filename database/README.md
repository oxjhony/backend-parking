# 📂 Base de Datos - CampusParking

Base de datos PostgreSQL en AWS RDS con triggers para integridad referencial.

---

## 🌐 Configuración en Producción (AWS RDS)

**Actual**: Base de datos en la nube
- Host: `database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com`
- Puerto: `5432`
- Base de datos: `campus_parking`
- SSL: ✅ Habilitado automáticamente

**Credenciales**: Ver archivo `.env` en la raíz del proyecto

---

## 📄 Archivos Esenciales

### 1. `reset-and-create-with-integrity.sql` ⭐
Script completo para crear la base de datos desde cero con **triggers de integridad referencial**.

**Incluye:**
- ✅ 4 ENUMs (tipo_vehiculo, tipo_propietario, estado_registro, rol_usuario)
- ✅ 6 tablas con constraints
- ✅ 6 triggers (validación automática de propietarios, prevención de eliminación)
- ✅ 13 índices para performance
- ✅ 3 vistas útiles (v_vehiculos_completos, v_registros_activos, v_estadisticas_parqueaderos)

**Uso (AWS RDS):**
```bash
export PGPASSWORD=tu_password
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f reset-and-create-with-integrity.sql
```

---

### 2. `datos-prueba.sql`
Inserta datos de ejemplo para probar la aplicación.

**Datos incluidos:**
- 3 usuarios (admin, superusuario, vigilante)
- 6 conductores institucionales
- 4 visitantes
- 11 vehículos (7 institucionales, 4 visitantes)
- 5 parqueaderos
- 10 registros de entrada/salida

**Uso (AWS RDS):**
```bash
export PGPASSWORD=tu_password
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d campus_parking \
     -f datos-prueba.sql
```

---

### 3. Scripts de Migración

#### `migrate-to-aws.bat` (Windows)
Migra toda la estructura y datos a AWS RDS en un solo paso.

**Uso:**
```cmd
cd database
migrate-to-aws.bat
```

#### `migrate-to-aws.sh` (Linux/macOS)
Versión bash del script de migración.

**Uso:**
```bash
cd database
chmod +x migrate-to-aws.sh
./migrate-to-aws.sh
```

---

## 🚀 Reconstruir Base de Datos (Completa)

### Opción 1: Script Automatizado (Recomendado)

**Windows:**
```cmd
cd database
migrate-to-aws.bat
```

**Linux/macOS:**
```bash
cd database
chmod +x migrate-to-aws.sh
./migrate-to-aws.sh
```

El script automáticamente:
1. ✅ Verifica conexión a AWS RDS
2. ✅ Elimina base de datos existente (si existe)
3. ✅ Crea base de datos nueva
4. ✅ Ejecuta `reset-and-create-with-integrity.sql`
5. ✅ Pregunta si insertar datos de prueba
6. ✅ Verifica la migración

---

### Opción 2: Manual (Paso a Paso)

```bash
# 1. Conectar a AWS RDS
export PGPASSWORD=root1234
export PGHOST=database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com
export PGPORT=5432
export PGUSER=postgres

# 2. Eliminar BD existente (CUIDADO: borra todos los datos)
psql -d postgres -c "DROP DATABASE IF EXISTS campus_parking;"

# 3. Crear BD nueva
psql -d postgres -c "CREATE DATABASE campus_parking WITH ENCODING='UTF8';"

# 4. Ejecutar script de estructura
psql -d campus_parking -f reset-and-create-with-integrity.sql

# 5. (Opcional) Insertar datos de prueba
psql -d campus_parking -f datos-prueba.sql

# 6. Verificar
psql -d campus_parking -c "\dt"
```

---

## 🔍 Verificar Instalación

### Ver tablas creadas:
```bash
export PGPASSWORD=root1234
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d campus_parking \
     -c "\dt"
```

**Salida esperada:**
```
 Schema |         Name           | Type  |  Owner
--------+------------------------+-------+----------
 public | conductores            | table | postgres
 public | parqueaderos           | table | postgres
 public | registros              | table | postgres
 public | usuarios               | table | postgres
 public | vehiculos              | table | postgres
 public | visitantes_conductores | table | postgres
```

---

## 📋 Estructura de la Base de Datos

### Tablas Principales

#### `usuarios`
- `id` (SERIAL) PRIMARY KEY
- `nombre`, `cedula` UNIQUE, `correo` UNIQUE
- `rol` (ENUM: 'ADMINISTRADOR', 'SUPERUSUARIO', 'VIGILANTE')

#### `conductores` (institucionales)
- `codigo` (VARCHAR 50) PRIMARY KEY
- `nombre`, `apellido`, `correo` UNIQUE, `telefono`

#### `visitantes_conductores`
- `cedula` (VARCHAR 20) PRIMARY KEY
- `nombre`, `apellido`, `telefono`, `correo`, `motivoVisita`

#### `vehiculos` (polimórfica)
- `placa` PRIMARY KEY
- `tipo_propietario` (ENUM: 'INSTITUCIONAL', 'VISITANTE')
- `propietario_id` - Validado por triggers
- `fecha_caducidad` - Obligatorio para visitantes

---

## 🔒 Integridad Referencial (Triggers)

### Triggers Implementados:

1. **`trigger_validar_propietario_vehiculo`**
   - Valida que el propietario exista antes de INSERT/UPDATE
   - Garantiza: No hay vehículos huérfanos

2. **`trigger_proteger_conductor/visitante`**
   - Previene eliminación de propietarios con vehículos
   - Garantiza: Integridad de datos

**Ver documentación completa**: `INTEGRIDAD-REFERENCIAL.md`

---

## ⚠️ Problemas Comunes

### Error: "Connection timed out"
**Solución**: Configurar Security Group en AWS Console  
**Ver**: `AWS-SETUP-SECURITY.md`

### Error: "password authentication failed"
**Solución**: Verificar `.env` tiene `DATABASE_PASSWORD=root1234`

---

## 🔐 Seguridad

**Desarrollo**:
- ✅ SSL habilitado
- ⚠️ Security Group abierto (0.0.0.0/0)

**Producción** (Recomendado):
- Cambiar contraseña postgres
- Restringir Security Group
- Crear usuario específico para app
- Habilitar backups

**Ver guía**: `AWS-SETUP-SECURITY.md`

---

## 📚 Documentación Adicional

- `INTEGRIDAD-REFERENCIAL.md` - Triggers vs Foreign Keys
- `AWS-SETUP-SECURITY.md` - Configuración de seguridad AWS

---

**Última actualización:** Noviembre 2025  
**PostgreSQL:** 16+ (AWS RDS)  
**Framework:** NestJS 10+  
**Región AWS:** us-east-2
