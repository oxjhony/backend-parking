-- Script de rollback para la migración de visitantes
-- Fecha: 2025-11-20
-- Descripción: Revierte los cambios realizados en 001_agregar_soporte_visitantes.sql

-- ============================================================================
-- 1. Eliminar índices creados
-- ============================================================================
DROP INDEX IF EXISTS idx_visitantes_nombre;
DROP INDEX IF EXISTS idx_vehiculos_propietario;
DROP INDEX IF EXISTS idx_registros_visitantes;

-- ============================================================================
-- 2. Revertir cambios en tabla registros
-- ============================================================================

-- Renombrar columnas de vuelta a camelCase
ALTER TABLE registros 
    RENAME COLUMN hora_entrada TO "horaEntrada";

ALTER TABLE registros 
    RENAME COLUMN hora_salida TO "horaSalida";

ALTER TABLE registros 
    RENAME COLUMN vehiculo_placa TO "vehiculoPlaca";

ALTER TABLE registros 
    RENAME COLUMN usuario_id TO "usuarioId";

ALTER TABLE registros 
    RENAME COLUMN parqueadero_id TO "parqueaderoId";

-- Eliminar columna motivo_visita
ALTER TABLE registros 
    DROP COLUMN IF EXISTS motivo_visita;

-- ============================================================================
-- 3. Revertir cambios en tabla vehiculos
-- ============================================================================

-- Renombrar fecha de vuelta
ALTER TABLE vehiculos 
    RENAME COLUMN fecha_caducidad TO "fechaCaducidad";

-- Hacer campos NOT NULL de nuevo
ALTER TABLE vehiculos 
    ALTER COLUMN marca SET NOT NULL,
    ALTER COLUMN modelo SET NOT NULL,
    ALTER COLUMN color SET NOT NULL;

-- Eliminar nuevas columnas
ALTER TABLE vehiculos 
    DROP COLUMN IF EXISTS tipo_propietario,
    DROP COLUMN IF EXISTS propietario_id;

-- Si se había eliminado conductorCodigo, habría que restaurarlo desde un backup
-- o recrearlo manualmente

-- ============================================================================
-- 4. Eliminar tabla de visitantes
-- ============================================================================
DROP TABLE IF EXISTS visitantes_conductores;

-- ============================================================================
-- 5. Eliminar tipo enum
-- ============================================================================
DROP TYPE IF EXISTS tipo_propietario_enum;

-- ============================================================================
-- Verificación del rollback
-- ============================================================================
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('vehiculos', 'registros', 'visitantes_conductores')
ORDER BY table_name, ordinal_position;

COMMIT;
