-- ============================================
-- Script de Configuración Inicial
-- Sistema CampusParking - Universidad de Caldas
-- ============================================
-- PostgreSQL 13+ requerido (se usa la versión 17.6)
-- Ejecutar como usuario: postgres
-- Puerto: 5433 (verificar en .env)
-- ============================================

-- PASO 1: Eliminar base de datos si existe (CUIDADO: Borra todos los datos)
DROP DATABASE IF EXISTS campus_parking;

-- PASO 2: Crear la base de datos
CREATE DATABASE campus_parking
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE template0
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- PASO 3: Conectarse a la base de datos
\c campus_parking

-- PASO 4: Crear extensiones (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- IMPORTANTE: Las tablas se crean automáticamente
-- ============================================
-- TypeORM creará las tablas cuando inicies la aplicación
-- con: npm run start:dev
--
-- Estructura de tablas que se crearán:
--
-- TABLA: conductores
--   - codigo (VARCHAR 50) PRIMARY KEY - Código único del conductor (10 dígitos)
--   - nombre (VARCHAR 50) - Nombre del conductor
--   - apellido (VARCHAR 50) - Apellido del conductor
--   - correo (VARCHAR 100) UNIQUE - Correo institucional (@ucaldas.edu.co)
--   - telefono (VARCHAR 20) - Número de teléfono celular
--
-- TABLA: vehiculos
--   - placa (VARCHAR 20) PRIMARY KEY - Placa del vehículo (identificador único)
--   - tipo (ENUM) - CARRO o MOTO
--   - marca (VARCHAR 50)
--   - modelo (VARCHAR 50)
--   - color (VARCHAR 30)
--   - fechaCaducidad (TIMESTAMP) - Fecha de vencimiento del permiso
--   - conductorCodigo (VARCHAR 50) FOREIGN KEY -> conductores(codigo)
--
-- TABLA: parqueaderos
--   - id (SERIAL) PRIMARY KEY - ID autogenerado
--   - nombre (VARCHAR 100)
--   - direccion (VARCHAR 200)
--   - capacidad (INTEGER) - Capacidad total
--   - cuposDisponibles (INTEGER) - Cupos actuales disponibles
--
-- RELACIONES:
--   vehiculos.conductorCodigo -> conductores.codigo (Many-to-One)
--   Un conductor puede tener múltiples vehículos
--
-- ============================================
-- INSTRUCCIONES PARA TU COMPAÑERO:
-- ============================================
--
-- 1. Asegúrate de tener PostgreSQL 13+ instalado
--
-- 2. Verifica el archivo .env en la raíz del proyecto:
--    DATABASE_HOST=localhost
--    DATABASE_PORT=5433
--    DATABASE_USER=postgres
--    DATABASE_PASSWORD=admin1234
--    DATABASE_NAME=campus_parking
--
-- 3. Ejecutar este script:
--    Opción A (línea de comandos):
--      psql -U postgres -h localhost -p 5433 -f database/setup.sql
--
--    Opción B (pgAdmin):
--      - Abrir Query Tool
--      - Cargar este archivo
--      - Ejecutar (F5)
--
-- 4. Instalar dependencias Node:
--    npm install
--
-- 5. Iniciar la aplicación (esto creará las tablas):
--    npm run start:dev
--
-- 6. (Opcional) Insertar datos de prueba:
--    psql -U postgres -h localhost -p 5433 -d campus_parking -f database/datos-prueba.sql
--
-- 7. Verificar que todo funciona:
--    curl http://localhost:3000/conductor
--    curl http://localhost:3000/vehiculo
--    curl http://localhost:3000/parqueadero
--
-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- - Los códigos de conductor son de 10 dígitos (ej: 0000028932)
-- - Las placas de vehículos son el identificador único
-- - synchronize: true está activado en desarrollo (crea tablas automáticamente)
-- - En producción se deben usar migraciones en lugar de synchronize
--
-- ============================================
