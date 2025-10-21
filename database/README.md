# 📂 Carpeta Database - Guía de Configuración

Esta carpeta contiene todos los scripts SQL necesarios para configurar la base de datos del proyecto CampusParking.

## 📄 Archivos Disponibles

### 1. `setup.sql` ⭐ (COMENZAR AQUÍ)
Script principal para crear la base de datos desde cero.

**Uso:**
```bash
psql -U postgres -h localhost -p 5433 -f database/setup.sql
```

**O en pgAdmin:**
- Query Tool → Abrir archivo → Ejecutar (F5)

---

### 2. `datos-prueba.sql`
Inserta datos de ejemplo para probar la aplicación.

**Uso:**
```bash
# Primero asegúrate de que la aplicación haya creado las tablas (npm run start:dev)
psql -U postgres -h localhost -p 5433 -d campus_parking -f database/datos-prueba.sql
```

**Datos incluidos:**
- 6 conductores de ejemplo
- 7 vehículos asociados
- 5 parqueaderos con cupos

---

### 3. Scripts de Utilidad

#### `add-postgres-to-path.bat` (Windows)
Añade PostgreSQL al PATH del sistema.

#### `recreate-db.bat` (Windows)
Ejecuta la recreación de la BD con un solo click.

#### `insertar-datos.bat` (Windows)
Inserta los datos de prueba con un solo click.

#### `verificar-estructura.sh` (Bash/Linux)
Verifica la estructura de las tablas.

---

## 🚀 Guía Rápida 

### Opción 1: Configuración Rápida (Recomendada)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd backend-parking

# 2. Instalar dependencias
npm install

# 3. Copiar archivo de configuración
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL

# 4. Crear la base de datos (verifica que puerto configuraste)
psql -U postgres -h localhost -p 5433 -f database/setup.sql

# 5. Iniciar la aplicación (crea las tablas automáticamente)
npm run start:dev

# 6. (Opcional) Insertar datos de prueba
psql -U postgres -h localhost -p 5433 -d campus_parking -f database/datos-prueba.sql
```

---

### Opción 2: Usando pgAdmin (Visual)

1. **Abrir pgAdmin 4**

2. **Crear la base de datos:**
   - Click derecho en Databases → Create → Database
   - Name: `campus_parking`
   - Owner: `postgres`
   - Save

3. **Iniciar la aplicación:**
   ```bash
   npm run start:dev
   ```
   - TypeORM creará las tablas automáticamente

4. **Insertar datos de prueba:**
   - Abrir Query Tool en la base de datos campus_parking
   - Cargar `database/datos-prueba.sql`
   - Ejecutar (F5)

---

## 🔍 Verificar la Instalación

### 1. Verificar que la base de datos existe:
```bash
psql -U postgres -h localhost -p 5433 -l | grep campus_parking
```

### 2. Ver las tablas creadas:
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -c "\dt"
```

Deberías ver:
- `conductores`
- `vehiculos`
- `parqueaderos`

### 3. Ver estructura de una tabla:
```bash
psql -U postgres -h localhost -p 5433 -d campus_parking -c "\d conductores"
```

### 4. Probar la API:
```bash
# Obtener todos los conductores
curl http://localhost:3000/conductor

# Obtener todos los vehículos
curl http://localhost:3000/vehiculo

# Obtener todos los parqueaderos
curl http://localhost:3000/parqueadero
```

---

## 📋 Estructura de la Base de Datos

### Tabla: `conductores`
```sql
codigo (VARCHAR 50) PRIMARY KEY
nombre (VARCHAR 100)
correo (VARCHAR 100) UNIQUE
```
**Ejemplo de datos:**
- Código: `0000028932` (10 dígitos con ceros a la izquierda)
- Correo: `usuario@ucaldas.edu.co`

---

### Tabla: `vehiculos`
```sql
placa (VARCHAR 20) PRIMARY KEY
tipo (ENUM: 'CARRO' | 'MOTO')
marca (VARCHAR 50)
modelo (VARCHAR 50)
color (VARCHAR 30)
fechaCaducidad (TIMESTAMP)
conductorCodigo (VARCHAR 50) FOREIGN KEY
```

---

### Tabla: `parqueaderos`
```sql
id (SERIAL) PRIMARY KEY
nombre (VARCHAR 100)
direccion (VARCHAR 200)
capacidad (INTEGER)
cuposDisponibles (INTEGER)
```

---

## ⚠️ Problemas Comunes y Soluciones


### Error: "database already exists"
**Solución:**
```bash
# Eliminar la BD existente
psql -U postgres -h localhost -p 5433 -c "DROP DATABASE campus_parking;"

# Volver a ejecutar setup.sql
psql -U postgres -h localhost -p 5433 -f database/setup.sql
```

### Error: "password authentication failed"
**Solución:**
- Verifica que la contraseña en `.env` coincida con tu PostgreSQL
- Contraseña por defecto: `admin1234`

### Error: "connection refused"
**Solución:**
- Verifica que PostgreSQL esté corriendo
- Verifica el puerto en `.env` (5433 o 5432)
- Inicia PostgreSQL: `net start postgresql-x64-17` (Windows)

### Las tablas no se crean
**Solución:**
1. Verifica que `synchronize: true` esté en `database.module.ts`
2. Verifica los logs al iniciar `npm run start:dev`
3. Revisa que las entidades tengan decoradores de TypeORM

---

## 🔒 Seguridad

- **NO subir el archivo `.env` al repositorio** (ya está en `.gitignore`)
- La contraseña por defecto `admin1234` es solo para desarrollo
- En producción usar variables de entorno seguras
- Desactivar `synchronize: true` en producción

---

## 📚 Recursos Adicionales

- [Documentación TypeORM](https://typeorm.io/)
- [Documentación NestJS + TypeORM](https://docs.nestjs.com/techniques/database)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)

---


---

**Última actualización:** Octubre 2025  
**Versión PostgreSQL:** 17+  
**Versión Node:** 18+  
**Framework:** NestJS 10+
