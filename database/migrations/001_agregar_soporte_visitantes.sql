-- Migración: Agregar soporte para visitantes
-- Fecha: 2025-11-20
-- Descripción: Crea tabla visitantes_conductores y modifica vehiculos y registros
--             para soportar tanto conductores institucionales como visitantes

-- ============================================================================
-- 1. Crear tabla de visitantes conductores
-- ============================================================================
CREATE TABLE IF NOT EXISTS visitantes_conductores (
    cedula VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    motivo_visita VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_visitantes_nombre ON visitantes_conductores(nombre, apellido);

-- ============================================================================
-- 2. Modificar tabla vehiculos para soportar discriminador de propietario
-- ============================================================================

-- Agregar columna tipo_propietario (ENUM)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_propietario_enum') THEN
        CREATE TYPE tipo_propietario_enum AS ENUM ('INSTITUCIONAL', 'VISITANTE');
    END IF;
END $$;

ALTER TABLE vehiculos 
    ADD COLUMN IF NOT EXISTS tipo_propietario tipo_propietario_enum;

-- Agregar columna propietario_id (reemplaza conductorCodigo)
ALTER TABLE vehiculos 
    ADD COLUMN IF NOT EXISTS propietario_id VARCHAR(50);

-- Migrar datos existentes: copiar conductorCodigo a propietario_id y establecer tipo INSTITUCIONAL
UPDATE vehiculos 
SET tipo_propietario = 'INSTITUCIONAL',
    propietario_id = "conductorCodigo"
WHERE tipo_propietario IS NULL;

-- Hacer campos opcionales (nullable) para visitantes
ALTER TABLE vehiculos 
    ALTER COLUMN marca DROP NOT NULL,
    ALTER COLUMN modelo DROP NOT NULL,
    ALTER COLUMN color DROP NOT NULL;

-- Renombrar columna de fecha
ALTER TABLE vehiculos 
    RENAME COLUMN "fechaCaducidad" TO fecha_caducidad;

-- Establecer NOT NULL después de migrar datos
ALTER TABLE vehiculos 
    ALTER COLUMN tipo_propietario SET NOT NULL,
    ALTER COLUMN propietario_id SET NOT NULL;

-- Crear índice compuesto para búsqueda por propietario
CREATE INDEX IF NOT EXISTS idx_vehiculos_propietario 
    ON vehiculos(tipo_propietario, propietario_id);

-- NOTA: No eliminamos conductorCodigo todavía para mantener compatibilidad
-- Se puede eliminar después de verificar que la migración funciona correctamente
-- ALTER TABLE vehiculos DROP COLUMN IF EXISTS "conductorCodigo";

-- ============================================================================
-- 3. Modificar tabla registros para agregar motivo de visita
-- ============================================================================

-- Agregar campo motivo_visita (solo para visitantes)
ALTER TABLE registros 
    ADD COLUMN IF NOT EXISTS motivo_visita VARCHAR(255);

-- Renombrar columnas para consistencia con snake_case
ALTER TABLE registros 
    RENAME COLUMN "horaEntrada" TO hora_entrada;

ALTER TABLE registros 
    RENAME COLUMN "horaSalida" TO hora_salida;

ALTER TABLE registros 
    RENAME COLUMN "vehiculoPlaca" TO vehiculo_placa;

ALTER TABLE registros 
    RENAME COLUMN "usuarioId" TO usuario_id;

ALTER TABLE registros 
    RENAME COLUMN "parqueaderoId" TO parqueadero_id;

-- Crear índice para búsqueda de registros de visitantes
CREATE INDEX IF NOT EXISTS idx_registros_visitantes 
    ON registros(motivo_visita) 
    WHERE motivo_visita IS NOT NULL;

-- ============================================================================
-- 4. Comentarios y documentación
-- ============================================================================

COMMENT ON TABLE visitantes_conductores IS 
    'Conductores visitantes (temporales) que no están en la base institucional';

COMMENT ON COLUMN vehiculos.tipo_propietario IS 
    'Discriminador: INSTITUCIONAL (conductores tabla) o VISITANTE (visitantes_conductores tabla)';

COMMENT ON COLUMN vehiculos.propietario_id IS 
    'ID del propietario: codigo (institucional) o cedula (visitante)';

COMMENT ON COLUMN registros.motivo_visita IS 
    'Motivo de la visita (solo para vehículos de visitantes)';

-- ============================================================================
-- Verificación de la migración
-- ============================================================================

-- Verificar conteo de vehículos migrados
SELECT 
    tipo_propietario,
    COUNT(*) as cantidad
FROM vehiculos
GROUP BY tipo_propietario;

-- Verificar que todos los vehículos tienen propietario_id
SELECT COUNT(*) as vehiculos_sin_propietario
FROM vehiculos
WHERE propietario_id IS NULL;

COMMIT;
