-- ============================================
-- SCRIPT COMPLETO: RESET + SCHEMA CON INTEGRIDAD REFERENCIAL
-- CampusParking - Universidad de Caldas
-- ============================================
-- Este script:
-- 1. Elimina la BD actual
-- 2. Crea BD nueva con relaciones polimórficas VALIDADAS
-- 3. Usa triggers para garantizar integridad referencial
-- ============================================

-- PASO 1: Terminar conexiones y eliminar BD
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'campus_parking' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS campus_parking;

-- PASO 2: Crear BD nueva
CREATE DATABASE campus_parking
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE template0;

\c campus_parking

-- PASO 3: Crear extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PASO 4: CREAR TIPOS ENUM
-- ============================================

CREATE TYPE tipo_vehiculo AS ENUM ('CARRO', 'MOTO');
CREATE TYPE tipo_propietario AS ENUM ('INSTITUCIONAL', 'VISITANTE');
CREATE TYPE estado_registro AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE rol_usuario AS ENUM ('VIGILANTE', 'ADMINISTRADOR', 'SUPERUSUARIO');

-- ============================================
-- PASO 5: CREAR TABLAS
-- ============================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    "claveEncriptada" VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'VIGILANTE',
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_usuarios_cedula_length CHECK (length(cedula) >= 6),
    CONSTRAINT ck_usuarios_correo_format CHECK (correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

-- Tabla: conductores (institucionales)
CREATE TABLE conductores (
    codigo VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    
    CONSTRAINT ck_conductores_codigo_length CHECK (length(codigo) >= 6),
    CONSTRAINT ck_conductores_correo_ucaldas CHECK (correo LIKE '%@ucaldas.edu.co')
);

-- Tabla: visitantes_conductores
CREATE TABLE visitantes_conductores (
    cedula VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(100),
    "motivoVisita" VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_visitantes_cedula_numeric CHECK (cedula ~ '^[0-9]+$'),
    CONSTRAINT ck_visitantes_telefono_length CHECK (length(telefono) BETWEEN 7 AND 20),
    CONSTRAINT ck_visitantes_correo_format CHECK (
        correo IS NULL OR correo ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    )
);

-- Tabla: parqueaderos
CREATE TABLE parqueaderos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    "capacidadCarros" INTEGER NOT NULL DEFAULT 0,
    "capacidadMotos" INTEGER NOT NULL DEFAULT 0,
    "cuposDisponiblesCarros" INTEGER NOT NULL DEFAULT 0,
    "cuposDisponiblesMotos" INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT ck_parqueaderos_capacidad_carros CHECK ("capacidadCarros" >= 0),
    CONSTRAINT ck_parqueaderos_capacidad_motos CHECK ("capacidadMotos" >= 0),
    CONSTRAINT ck_parqueaderos_cupos_carros CHECK ("cuposDisponiblesCarros" >= 0),
    CONSTRAINT ck_parqueaderos_cupos_motos CHECK ("cuposDisponiblesMotos" >= 0),
    CONSTRAINT ck_parqueaderos_cupos_carros_max CHECK ("cuposDisponiblesCarros" <= "capacidadCarros"),
    CONSTRAINT ck_parqueaderos_cupos_motos_max CHECK ("cuposDisponiblesMotos" <= "capacidadMotos")
);

-- Tabla: vehiculos (POLIMÓRFICA con validación)
CREATE TABLE vehiculos (
    placa VARCHAR(20) PRIMARY KEY,
    tipo tipo_vehiculo NOT NULL,
    tipo_propietario tipo_propietario NOT NULL,
    propietario_id VARCHAR(50) NOT NULL,
    "conductorCodigo" VARCHAR(50),  -- Deprecated, mantener para compatibilidad
    marca VARCHAR(50),
    modelo VARCHAR(50),
    color VARCHAR(30),
    fecha_caducidad TIMESTAMP,
    
    CONSTRAINT ck_vehiculos_placa_format CHECK (placa ~ '^[A-Z0-9]+$')
);

-- Tabla: registros
CREATE TABLE registros (
    id SERIAL PRIMARY KEY,
    "horaEntrada" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaSalida" TIMESTAMP,
    estado estado_registro NOT NULL DEFAULT 'ACTIVO',
    motivo_visita VARCHAR(255),
    "vehiculoPlaca" VARCHAR(20) NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "parqueaderoId" INTEGER NOT NULL,
    
    CONSTRAINT fk_registros_vehiculo 
        FOREIGN KEY ("vehiculoPlaca") 
        REFERENCES vehiculos(placa) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_registros_usuario 
        FOREIGN KEY ("usuarioId") 
        REFERENCES usuarios(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_registros_parqueadero 
        FOREIGN KEY ("parqueaderoId") 
        REFERENCES parqueaderos(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    
    CONSTRAINT ck_registros_salida_after_entrada 
        CHECK ("horaSalida" IS NULL OR "horaSalida" >= "horaEntrada")
);

-- ============================================
-- PASO 6: TRIGGERS PARA INTEGRIDAD REFERENCIAL
-- ============================================

-- Función: Validar que propietario existe según tipo
CREATE OR REPLACE FUNCTION validar_propietario_vehiculo()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que tipo_propietario y propietario_id no sean NULL
    IF NEW.tipo_propietario IS NULL OR NEW.propietario_id IS NULL THEN
        RAISE EXCEPTION 'tipo_propietario y propietario_id son obligatorios';
    END IF;
    
    -- Validar según tipo de propietario
    IF NEW.tipo_propietario = 'INSTITUCIONAL' THEN
        -- Verificar que el conductor existe
        IF NOT EXISTS (SELECT 1 FROM conductores WHERE codigo = NEW.propietario_id) THEN
            RAISE EXCEPTION 'El conductor con código % no existe en la tabla conductores', NEW.propietario_id
                USING HINT = 'Debe crear el conductor antes de asignar el vehículo';
        END IF;
        
        -- Sincronizar conductorCodigo (campo deprecated)
        NEW."conductorCodigo" := NEW.propietario_id;
        
    ELSIF NEW.tipo_propietario = 'VISITANTE' THEN
        -- Verificar que el visitante existe
        IF NOT EXISTS (SELECT 1 FROM visitantes_conductores WHERE cedula = NEW.propietario_id) THEN
            RAISE EXCEPTION 'El visitante con cédula % no existe en la tabla visitantes_conductores', NEW.propietario_id
                USING HINT = 'Debe crear el visitante antes de asignar el vehículo';
        END IF;
        
        -- Validar que tenga fecha_caducidad
        IF NEW.fecha_caducidad IS NULL THEN
            RAISE EXCEPTION 'Los vehículos de visitantes deben tener fecha_caducidad'
                USING HINT = 'Asigne una fecha de vencimiento para el permiso temporal';
        END IF;
        
        -- Limpiar conductorCodigo para visitantes
        NEW."conductorCodigo" := NULL;
        
    ELSE
        RAISE EXCEPTION 'tipo_propietario inválido: %. Debe ser INSTITUCIONAL o VISITANTE', NEW.tipo_propietario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validar antes de insertar o actualizar vehículo
CREATE TRIGGER trigger_validar_propietario_vehiculo
    BEFORE INSERT OR UPDATE ON vehiculos
    FOR EACH ROW
    EXECUTE FUNCTION validar_propietario_vehiculo();

-- ============================================
-- Función: Prevenir eliminación de propietarios con vehículos
CREATE OR REPLACE FUNCTION prevenir_eliminar_propietario_con_vehiculos()
RETURNS TRIGGER AS $$
DECLARE
    cuenta_vehiculos INTEGER;
BEGIN
    -- Para conductores
    IF TG_TABLE_NAME = 'conductores' THEN
        SELECT COUNT(*) INTO cuenta_vehiculos
        FROM vehiculos 
        WHERE tipo_propietario = 'INSTITUCIONAL' AND propietario_id = OLD.codigo;
        
        IF cuenta_vehiculos > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el conductor % porque tiene % vehículo(s) asociado(s)', 
                OLD.codigo, cuenta_vehiculos
                USING HINT = 'Elimine o reasigne los vehículos primero';
        END IF;
    END IF;
    
    -- Para visitantes
    IF TG_TABLE_NAME = 'visitantes_conductores' THEN
        SELECT COUNT(*) INTO cuenta_vehiculos
        FROM vehiculos 
        WHERE tipo_propietario = 'VISITANTE' AND propietario_id = OLD.cedula;
        
        IF cuenta_vehiculos > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar el visitante % porque tiene % vehículo(s) asociado(s)', 
                OLD.cedula, cuenta_vehiculos
                USING HINT = 'Elimine o reasigne los vehículos primero';
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Proteger conductores y visitantes
CREATE TRIGGER trigger_proteger_conductor
    BEFORE DELETE ON conductores
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_eliminar_propietario_con_vehiculos();

CREATE TRIGGER trigger_proteger_visitante
    BEFORE DELETE ON visitantes_conductores
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_eliminar_propietario_con_vehiculos();

-- ============================================
-- Función: Actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-actualizar timestamps
CREATE TRIGGER trigger_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_actualizar_visitantes
    BEFORE UPDATE ON visitantes_conductores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- PASO 7: CREAR ÍNDICES OPTIMIZADOS
-- ============================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX idx_vehiculos_propietario ON vehiculos(tipo_propietario, propietario_id);
CREATE INDEX idx_vehiculos_fecha_caducidad ON vehiculos(fecha_caducidad) 
    WHERE fecha_caducidad IS NOT NULL;

CREATE INDEX idx_registros_estado ON registros(estado);
CREATE INDEX idx_registros_entrada ON registros("horaEntrada" DESC);
CREATE INDEX idx_registros_vehiculo ON registros("vehiculoPlaca");
CREATE INDEX idx_registros_usuario ON registros("usuarioId");
CREATE INDEX idx_registros_parqueadero ON registros("parqueaderoId");
CREATE INDEX idx_registros_activos ON registros("vehiculoPlaca", estado) 
    WHERE estado = 'ACTIVO';

CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);

CREATE INDEX idx_conductores_correo ON conductores(correo);

CREATE INDEX idx_visitantes_fecha_creacion ON visitantes_conductores(fecha_creacion DESC);

-- ============================================
-- PASO 8: CREAR VISTAS ÚTILES
-- ============================================

-- Vista: Vehículos con información completa del propietario
CREATE OR REPLACE VIEW v_vehiculos_completos AS
SELECT 
    v.placa,
    v.tipo,
    v.tipo_propietario,
    v.propietario_id,
    v.marca,
    v.modelo,
    v.color,
    v.fecha_caducidad,
    CASE 
        WHEN v.tipo_propietario = 'INSTITUCIONAL' THEN c.nombre || ' ' || c.apellido
        WHEN v.tipo_propietario = 'VISITANTE' THEN vc.nombre || ' ' || vc.apellido
    END as nombre_propietario,
    CASE 
        WHEN v.tipo_propietario = 'INSTITUCIONAL' THEN c.correo
        WHEN v.tipo_propietario = 'VISITANTE' THEN vc.correo
    END as correo_propietario,
    CASE 
        WHEN v.tipo_propietario = 'INSTITUCIONAL' THEN c.telefono
        WHEN v.tipo_propietario = 'VISITANTE' THEN vc.telefono
    END as telefono_propietario
FROM vehiculos v
LEFT JOIN conductores c 
    ON v.tipo_propietario = 'INSTITUCIONAL' AND v.propietario_id = c.codigo
LEFT JOIN visitantes_conductores vc 
    ON v.tipo_propietario = 'VISITANTE' AND v.propietario_id = vc.cedula;

-- Vista: Registros activos con información completa
CREATE OR REPLACE VIEW v_registros_activos AS
SELECT 
    r.id,
    r."horaEntrada",
    r."vehiculoPlaca",
    v.tipo as tipo_vehiculo,
    v.tipo_propietario,
    v.marca,
    v.modelo,
    v.color,
    CASE 
        WHEN v.tipo_propietario = 'INSTITUCIONAL' THEN c.nombre || ' ' || c.apellido
        WHEN v.tipo_propietario = 'VISITANTE' THEN vc.nombre || ' ' || vc.apellido
    END as nombre_propietario,
    CASE 
        WHEN v.tipo_propietario = 'INSTITUCIONAL' THEN c.correo
        WHEN v.tipo_propietario = 'VISITANTE' THEN vc.correo
    END as correo_propietario,
    r.motivo_visita,
    p.nombre as parqueadero,
    u.nombre as usuario_registro
FROM registros r
JOIN vehiculos v ON r."vehiculoPlaca" = v.placa
LEFT JOIN conductores c 
    ON v.tipo_propietario = 'INSTITUCIONAL' AND v.propietario_id = c.codigo
LEFT JOIN visitantes_conductores vc 
    ON v.tipo_propietario = 'VISITANTE' AND v.propietario_id = vc.cedula
JOIN parqueaderos p ON r."parqueaderoId" = p.id
JOIN usuarios u ON r."usuarioId" = u.id
WHERE r.estado = 'ACTIVO';

-- Vista: Estadísticas de ocupación
CREATE OR REPLACE VIEW v_estadisticas_parqueaderos AS
SELECT 
    p.id,
    p.nombre,
    p.direccion,
    p."capacidadCarros",
    p."capacidadMotos",
    p."cuposDisponiblesCarros",
    p."cuposDisponiblesMotos",
    (p."capacidadCarros" - p."cuposDisponiblesCarros") as carros_ocupados,
    (p."capacidadMotos" - p."cuposDisponiblesMotos") as motos_ocupadas,
    (p."capacidadCarros" + p."capacidadMotos") as capacidad_total,
    (p."cuposDisponiblesCarros" + p."cuposDisponiblesMotos") as cupos_disponibles_total,
    ROUND(
        ((p."capacidadCarros" - p."cuposDisponiblesCarros")::DECIMAL / 
         NULLIF(p."capacidadCarros", 0) * 100), 2
    ) as porcentaje_ocupacion_carros,
    ROUND(
        ((p."capacidadMotos" - p."cuposDisponiblesMotos")::DECIMAL / 
         NULLIF(p."capacidadMotos", 0) * 100), 2
    ) as porcentaje_ocupacion_motos
FROM parqueaderos p;

-- ============================================
-- PASO 9: VERIFICACIÓN
-- ============================================

-- Verificar tablas creadas
SELECT 'TABLAS CREADAS:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Verificar triggers creados
SELECT 'TRIGGERS CREADOS:' as status;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar índices creados
SELECT 'ÍNDICES CREADOS:' as status;
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verificar vistas creadas
SELECT 'VISTAS CREADAS:' as status;
SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;

-- ============================================
-- MENSAJES FINALES
-- ============================================

SELECT '============================================' as separador;
SELECT '✅ BASE DE DATOS CREADA EXITOSAMENTE' as resultado;
SELECT '============================================' as separador;
SELECT '' as espacio;
SELECT '📋 Características implementadas:' as info;
SELECT '  ✅ Integridad referencial con triggers' as detalle;
SELECT '  ✅ Validación automática de propietarios' as detalle;
SELECT '  ✅ Prevención de eliminación de propietarios con vehículos' as detalle;
SELECT '  ✅ Índices optimizados para performance' as detalle;
SELECT '  ✅ Vistas útiles para consultas' as detalle;
SELECT '' as espacio;
SELECT '📝 Próximos pasos:' as info;
SELECT '  1. Ejecutar: psql -f database/datos-prueba.sql' as paso;
SELECT '  2. Iniciar app: npm run start:dev' as paso;
SELECT '  3. Cambiar en database.module.ts: synchronize: false' as paso;
SELECT '============================================' as separador;
