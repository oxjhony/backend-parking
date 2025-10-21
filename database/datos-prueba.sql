-- Datos de prueba para CampusParking
-- Ejecutar después de que TypeORM cree las tablas

\c campus_parking

-- Insertar conductores de prueba
INSERT INTO conductores (codigo, nombre, apellido, correo, telefono) VALUES
('0000028932', 'Juan Carlos', 'Pérez González', 'juan.perez@ucaldas.edu.co', '3101234567'),
('0000045123', 'María Fernanda', 'López Rodríguez', 'maria.lopez@ucaldas.edu.co', '3109876543'),
('0000067890', 'Pedro Antonio', 'Ramírez Silva', 'pedro.ramirez@ucaldas.edu.co', '3151234567'),
('1000000001', 'Ana María', 'Torres Castro', 'ana.torres@ucaldas.edu.co', '3201234567'),
('1000000002', 'Carlos Eduardo', 'Gómez Martínez', 'carlos.gomez@ucaldas.edu.co', '3009876543'),
('2000000001', 'Laura Patricia', 'Muñoz Herrera', 'laura.munoz@ucaldas.edu.co', '3187654321');

-- Insertar vehículos de prueba
INSERT INTO vehiculos (placa, tipo, marca, modelo, color, "fechaCaducidad", "conductorCodigo") VALUES
('ABC123', 'CARRO', 'Toyota', 'Corolla 2020', 'Rojo', '2025-12-31', '0000028932'),
('XYZ78A', 'MOTO', 'Yamaha', 'FZ-16', 'Azul', '2025-06-30', '0000028932'),
('DEF456', 'CARRO', 'Chevrolet', 'Spark GT', 'Blanco', '2025-12-31', '0000045123'),
('GHI78T', 'MOTO', 'Honda', 'CB 190', 'Negro', '2025-09-15', '0000067890'),
('JKL012', 'CARRO', 'Mazda', '3 Sedan', 'Gris', '2025-12-31', '1000000001'),
('MNO345', 'CARRO', 'Renault', 'Logan', 'Blanco', '2025-12-31', '1000000002'),
('PQR678', 'CARRO', 'Nissan', 'Versa', 'Plateado', '2025-12-31', '2000000001');

-- Insertar parqueaderos de prueba
INSERT INTO parqueaderos (nombre, direccion, capacidad, "cuposDisponibles") VALUES
('Parqueadero Campus central', 'Calle 5 # 4-70, campus central', 100, 95),
('Parqueadero ciencias sociales y juridicas', 'Sector las palmas', 50, 48),
('Parqueadero facultad de salud', 'facultad de salud', 30, 28),
('Parqueadero Ciencias Humanas', 'Sector Humanidades', 40, 40),
('Parqueadero jardñin botanico', 'Entrada jardín botanico', 60, 55);

-- Verificar los datos insertados
SELECT 'CONDUCTORES REGISTRADOS:' as info;
SELECT * FROM conductores;

SELECT 'VEHÍCULOS REGISTRADOS:' as info;
SELECT v.placa, v.tipo, v.marca, v.modelo, v.color, 
       CONCAT(c.nombre, ' ', c.apellido) as conductor
FROM vehiculos v
JOIN conductores c ON v."conductorCodigo" = c.codigo;

SELECT 'PARQUEADEROS DISPONIBLES:' as info;
SELECT nombre, direccion, capacidad, "cuposDisponibles", 
       (capacidad - "cuposDisponibles") as ocupados
FROM parqueaderos;
