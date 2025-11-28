-- Datos de prueba para CampusParking
-- Ejecutar después de reset-and-create-with-integrity.sql
-- Este archivo es compatible con el nuevo esquema con integridad referencial

\c campus_parking

-- ============================================
-- PASO 1: INSERTAR USUARIOS
-- ============================================
-- Contraseñas:
-- - admin1234: $2b$10$Eah3Qb9VbD5NsvBSPqxEHuhBt6FWdvU8cTfYlgSv/xUoVuwD70wx6
-- - 1234: $2b$10$jBfT9YwrtWleEJwe.anHMOQ3pSwBu7YOiEMh9HKLS4qy6W7wMmUFO

INSERT INTO usuarios (nombre, cedula, correo, "claveEncriptada", rol) VALUES
('Administrador Principal', '1234567890', 'admin@ucaldas.edu.co', '$2b$10$Eah3Qb9VbD5NsvBSPqxEHuhBt6FWdvU8cTfYlgSv/xUoVuwD70wx6', 'ADMINISTRADOR'),
('Super Usuario', '1234567891', 'superusuario@ucaldas.edu.co', '$2b$10$Eah3Qb9VbD5NsvBSPqxEHuhBt6FWdvU8cTfYlgSv/xUoVuwD70wx6', 'SUPERUSUARIO'),
('Juan Pérez', '9876543210', 'juan.perez@example.com', '$2b$10$jBfT9YwrtWleEJwe.anHMOQ3pSwBu7YOiEMh9HKLS4qy6W7wMmUFO', 'VIGILANTE')
ON CONFLICT (cedula) DO NOTHING;

-- ============================================
-- PASO 2: INSERTAR CONDUCTORES INSTITUCIONALES
-- ============================================

INSERT INTO conductores (codigo, nombre, apellido, correo, telefono) VALUES
('0000028932', 'Juan Carlos', 'Pérez González', 'juan.perez@ucaldas.edu.co', '3101234567'),
('0000045123', 'María Fernanda', 'López Rodríguez', 'maria.lopez@ucaldas.edu.co', '3109876543'),
('0000067890', 'Pedro Antonio', 'Ramírez Silva', 'pedro.ramirez@ucaldas.edu.co', '3151234567'),
('1000000001', 'Ana María', 'Torres Castro', 'ana.torres@ucaldas.edu.co', '3201234567'),
('1000000002', 'Carlos Eduardo', 'Gómez Martínez', 'carlos.gomez@ucaldas.edu.co', '3009876543'),
('2000000001', 'Laura Patricia', 'Muñoz Herrera', 'laura.munoz@ucaldas.edu.co', '3187654321')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- PASO 3: INSERTAR VISITANTES
-- ============================================

INSERT INTO visitantes_conductores (cedula, nombre, apellido, telefono, correo, "motivoVisita") VALUES
('1001234567', 'Roberto', 'Sánchez', '3001112233', 'roberto.sanchez@gmail.com', 'Entrega de documentos'),
('1007654321', 'Diana', 'Martínez', '3009998877', 'diana.martinez@hotmail.com', 'Visita académica'),
('1003456789', 'Luis', 'Ramírez', '3155554444', NULL, 'Reunión con directivos'),
('1006543210', 'Carolina', 'Gómez', '3177778888', 'carolina.gomez@outlook.com', 'Conferencia invitada')
ON CONFLICT (cedula) DO NOTHING;

-- ============================================
-- PASO 4: INSERTAR PARQUEADEROS
-- ============================================

INSERT INTO parqueaderos (nombre, direccion, "capacidadCarros", "capacidadMotos", "cuposDisponiblesCarros", "cuposDisponiblesMotos") VALUES
('Parqueadero Campus central', 'Calle 5 # 4-70, campus central', 70, 30, 70, 30),
('Parqueadero ciencias sociales y juridicas', 'Sector las palmas', 35, 15, 35, 15),
('Parqueadero facultad de salud', 'facultad de salud', 20, 10, 20, 10),
('Parqueadero Ciencias Humanas', 'Sector Humanidades', 25, 15, 25, 15),
('Parqueadero jardín botanico', 'Entrada jardín botanico', 40, 20, 40, 20);

-- ============================================
-- PASO 5: INSERTAR VEHÍCULOS INSTITUCIONALES
-- ============================================
-- NOTA: Los triggers validarán automáticamente que los conductores existan

INSERT INTO vehiculos (placa, tipo, tipo_propietario, propietario_id, marca, modelo, color, fecha_caducidad) VALUES
('ABC123', 'CARRO', 'INSTITUCIONAL', '0000028932', 'Toyota', 'Corolla 2020', 'Rojo', '2025-12-31'),
('XYZ78A', 'MOTO', 'INSTITUCIONAL', '0000028932', 'Yamaha', 'FZ-16', 'Azul', '2025-06-30'),
('DEF456', 'CARRO', 'INSTITUCIONAL', '0000045123', 'Chevrolet', 'Spark GT', 'Blanco', '2025-12-31'),
('GHI78T', 'MOTO', 'INSTITUCIONAL', '0000067890', 'Honda', 'CB 190', 'Negro', '2025-09-15'),
('JKL012', 'CARRO', 'INSTITUCIONAL', '1000000001', 'Mazda', '3 Sedan', 'Gris', '2025-12-31'),
('MNO345', 'CARRO', 'INSTITUCIONAL', '1000000002', 'Renault', 'Logan', 'Blanco', '2025-12-31'),
('PQR678', 'CARRO', 'INSTITUCIONAL', '2000000001', 'Nissan', 'Versa', 'Plateado', '2025-12-31')
ON CONFLICT (placa) DO NOTHING;

-- ============================================
-- PASO 6: INSERTAR VEHÍCULOS DE VISITANTES
-- ============================================
-- NOTA: Los triggers validarán que los visitantes existan y que tengan fecha_caducidad

INSERT INTO vehiculos (placa, tipo, tipo_propietario, propietario_id, marca, modelo, color, fecha_caducidad) VALUES
('VIS001', 'CARRO', 'VISITANTE', '1001234567', 'Chevrolet', 'Sail', 'Negro', '2025-11-28'),
('VIS002', 'MOTO', 'VISITANTE', '1007654321', 'Suzuki', 'GN 125', 'Azul', '2025-11-28'),
('VIS003', 'CARRO', 'VISITANTE', '1003456789', 'Kia', 'Picanto', 'Rojo', '2025-11-30'),
('VIS004', 'CARRO', 'VISITANTE', '1006543210', 'Hyundai', 'i10', 'Blanco', '2025-11-28')
ON CONFLICT (placa) DO NOTHING;

-- ============================================
-- PASO 7: INSERTAR REGISTROS ACTIVOS
-- ============================================

INSERT INTO registros ("vehiculoPlaca", "usuarioId", "parqueaderoId", estado, motivo_visita) VALUES
-- Vehículos institucionales activos
('ABC123', (SELECT id FROM usuarios WHERE correo = 'admin@ucaldas.edu.co'), 1, 'ACTIVO', NULL),
('DEF456', (SELECT id FROM usuarios WHERE correo = 'admin@ucaldas.edu.co'), 1, 'ACTIVO', NULL),
('JKL012', (SELECT id FROM usuarios WHERE correo = 'superusuario@ucaldas.edu.co'), 1, 'ACTIVO', NULL),
('GHI78T', (SELECT id FROM usuarios WHERE correo = 'admin@ucaldas.edu.co'), 1, 'ACTIVO', NULL),
-- Vehículos de visitantes activos
('VIS001', (SELECT id FROM usuarios WHERE correo = 'juan.perez@example.com'), 1, 'ACTIVO', 'Entrega de documentos'),
('VIS002', (SELECT id FROM usuarios WHERE correo = 'juan.perez@example.com'), 2, 'ACTIVO', 'Visita académica'),
('VIS003', (SELECT id FROM usuarios WHERE correo = 'juan.perez@example.com'), 1, 'ACTIVO', 'Reunión con directivos');

-- Actualizar cupos disponibles de parqueaderos
UPDATE parqueaderos SET "cuposDisponiblesCarros" = "cuposDisponiblesCarros" - 4 WHERE id = 1;  -- 4 carros
UPDATE parqueaderos SET "cuposDisponiblesMotos" = "cuposDisponiblesMotos" - 1 WHERE id = 1;   -- 1 moto
UPDATE parqueaderos SET "cuposDisponiblesMotos" = "cuposDisponiblesMotos" - 1 WHERE id = 2;   -- 1 moto visitante

-- ============================================
-- PASO 8: INSERTAR REGISTROS HISTÓRICOS
-- ============================================

INSERT INTO registros ("vehiculoPlaca", "usuarioId", "parqueaderoId", "horaEntrada", "horaSalida", estado, motivo_visita) VALUES
('XYZ78A', (SELECT id FROM usuarios WHERE correo = 'admin@ucaldas.edu.co'), 1, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours', 'INACTIVO', NULL),
('MNO345', (SELECT id FROM usuarios WHERE correo = 'admin@ucaldas.edu.co'), 2, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '2 hours', 'INACTIVO', NULL),
('VIS004', (SELECT id FROM usuarios WHERE correo = 'juan.perez@example.com'), 1, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 'INACTIVO', 'Conferencia invitada');

-- ============================================
-- PASO 9: VERIFICACIÓN DE DATOS
-- ============================================
SELECT '============================================' as separador;
SELECT 'USUARIOS REGISTRADOS:' as info;
SELECT id, nombre, cedula, correo, rol FROM usuarios ORDER BY id;

SELECT '============================================' as separador;
SELECT 'CONDUCTORES INSTITUCIONALES:' as info;
SELECT codigo, nombre, apellido, correo, telefono FROM conductores ORDER BY codigo;

SELECT '============================================' as separador;
SELECT 'VISITANTES REGISTRADOS:' as info;
SELECT cedula, nombre, apellido, telefono, "motivoVisita" FROM visitantes_conductores ORDER BY cedula;

SELECT '============================================' as separador;
SELECT 'VEHÍCULOS INSTITUCIONALES:' as info;
SELECT v.placa, v.tipo, v.marca, v.modelo, v.color, v.tipo_propietario, v.propietario_id,
       CONCAT(c.nombre, ' ', c.apellido) as conductor,
       v.fecha_caducidad
FROM vehiculos v
LEFT JOIN conductores c ON v.propietario_id = c.codigo
WHERE v.tipo_propietario = 'INSTITUCIONAL'
ORDER BY v.placa;

SELECT '============================================' as separador;
SELECT 'VEHÍCULOS DE VISITANTES:' as info;
SELECT v.placa, v.tipo, v.marca, v.modelo, v.color, v.tipo_propietario, v.propietario_id,
       CONCAT(vc.nombre, ' ', vc.apellido) as visitante,
       vc."motivoVisita",
       v.fecha_caducidad
FROM vehiculos v
LEFT JOIN visitantes_conductores vc ON v.propietario_id = vc.cedula
WHERE v.tipo_propietario = 'VISITANTE'
ORDER BY v.placa;

SELECT '============================================' as separador;
SELECT 'PARQUEADEROS DISPONIBLES:' as info;
SELECT nombre, direccion, 
       "capacidadCarros", "cuposDisponiblesCarros", ("capacidadCarros" - "cuposDisponiblesCarros") as "ocupadosCarros",
       "capacidadMotos", "cuposDisponiblesMotos", ("capacidadMotos" - "cuposDisponiblesMotos") as "ocupadosMotos",
       ("capacidadCarros" + "capacidadMotos") as "capacidadTotal",
       ("cuposDisponiblesCarros" + "cuposDisponiblesMotos") as "cuposDisponiblesTotal"
FROM parqueaderos
ORDER BY id;

SELECT '============================================' as separador;
SELECT 'REGISTROS ACTIVOS (Vehículos en parqueadero):' as info;
SELECT r.id, r."vehiculoPlaca", v.tipo, v.tipo_propietario, r."horaEntrada", 
       p.nombre as parqueadero, u.nombre as vigilante, r.motivo_visita
FROM registros r
JOIN vehiculos v ON r."vehiculoPlaca" = v.placa
JOIN parqueaderos p ON r."parqueaderoId" = p.id
JOIN usuarios u ON r."usuarioId" = u.id
WHERE r."horaSalida" IS NULL
ORDER BY r."horaEntrada" DESC;

SELECT '============================================' as separador;
SELECT 'REGISTROS HISTÓRICOS (Últimos 10):' as info;
SELECT r.id, r."vehiculoPlaca", v.tipo, v.tipo_propietario, 
       r."horaEntrada", r."horaSalida", 
       EXTRACT(EPOCH FROM (r."horaSalida" - r."horaEntrada"))/3600 as "horasEstacionado",
       p.nombre as parqueadero, r.motivo_visita
FROM registros r
JOIN vehiculos v ON r."vehiculoPlaca" = v.placa
JOIN parqueaderos p ON r."parqueaderoId" = p.id
WHERE r."horaSalida" IS NOT NULL
ORDER BY r."horaSalida" DESC
LIMIT 10;

SELECT '============================================' as separador;
SELECT 'RESUMEN POR TIPO DE VEHÍCULO:' as info;
SELECT 
    tipo_propietario,
    COUNT(*) as total_vehiculos,
    SUM(CASE WHEN tipo = 'CARRO' THEN 1 ELSE 0 END) as carros,
    SUM(CASE WHEN tipo = 'MOTO' THEN 1 ELSE 0 END) as motos
FROM vehiculos
GROUP BY tipo_propietario
ORDER BY tipo_propietario;
