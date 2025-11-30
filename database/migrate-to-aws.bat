@echo off
REM ============================================
REM Script para MIGRAR a AWS RDS
REM CampusParking - Universidad de Caldas
REM ============================================

setlocal enabledelayedexpansion

echo ================================================
echo 🚀 MIGRACIÓN A AWS RDS
echo ================================================
echo.
echo Host: database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com
echo Puerto: 5432
echo Usuario: postgres
echo Base de datos: campus_parking
echo.

set PGPASSWORD=root1234
set PGHOST=database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com
set PGPORT=5432
set PGUSER=postgres

echo ================================================
echo Paso 1: Verificando conexión a AWS RDS...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT version();"

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo conectar a AWS RDS
    echo.
    echo Posibles causas:
    echo   1. Credenciales incorrectas
    echo   2. Security Group no permite conexión desde tu IP
    echo   3. RDS no está públicamente accesible
    echo   4. VPC/Subnet configuration incorrecta
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Conexión exitosa a AWS RDS
echo.

echo ================================================
echo Paso 2: Verificando si existe la base de datos...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'campus_parking'" | findstr "1" >nul

if %errorlevel% equ 0 (
    echo.
    echo ⚠️  La base de datos 'campus_parking' ya existe
    echo.
    set /p CONFIRM="¿Deseas ELIMINAR y RECREAR la base de datos? (S/N): "
    
    if /i "!CONFIRM!" neq "S" (
        echo.
        echo ❌ Migración cancelada por el usuario
        pause
        exit /b 1
    )
    
    echo.
    echo 🗑️  Terminando conexiones activas...
    
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'campus_parking' AND pid <> pg_backend_pid();"
    
    echo.
    echo 🗑️  Eliminando base de datos existente...
    
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "DROP DATABASE IF EXISTS campus_parking;"
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se pudo eliminar la base de datos
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Base de datos eliminada
)

echo.
echo ================================================
echo Paso 3: Creando base de datos campus_parking...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d postgres -c "CREATE DATABASE campus_parking WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;"

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo crear la base de datos
    pause
    exit /b 1
)

echo.
echo ✅ Base de datos creada exitosamente
echo.

echo ================================================
echo Paso 4: Creando estructura (tablas, triggers, vistas)...
echo ================================================
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -f "%~dp0reset-and-create-with-integrity.sql"

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo crear la estructura
    pause
    exit /b 1
)

echo.
echo ✅ Estructura creada exitosamente
echo.

echo ================================================
echo Paso 5: Insertando datos de prueba...
echo ================================================
echo.

set /p INSERT_DATA="¿Deseas insertar datos de prueba? (S/N): "

if /i "!INSERT_DATA!" equ "S" (
    echo.
    echo Insertando datos de prueba...
    
    psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -f "%~dp0datos-prueba.sql"
    
    if %errorlevel% neq 0 (
        echo.
        echo ⚠️  ADVERTENCIA: Algunos datos no se pudieron insertar
    ) else (
        echo.
        echo ✅ Datos de prueba insertados
    )
)

echo.
echo ================================================
echo Paso 6: Verificando migración...
echo ================================================
echo.

echo Tablas creadas:
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -c "\dt"

echo.
echo Triggers creados:
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -c "SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE NOT tgisinternal LIMIT 10;"

echo.
echo Vistas creadas:
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -c "\dv"

echo.
echo Datos insertados:
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d campus_parking -c "SELECT 'usuarios' as tabla, COUNT(*) as registros FROM usuarios UNION ALL SELECT 'conductores', COUNT(*) FROM conductores UNION ALL SELECT 'visitantes', COUNT(*) FROM visitantes_conductores UNION ALL SELECT 'vehiculos', COUNT(*) FROM vehiculos UNION ALL SELECT 'parqueaderos', COUNT(*) FROM parqueaderos UNION ALL SELECT 'registros', COUNT(*) FROM registros;"

echo.
echo ================================================
echo ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
echo ================================================
echo.
echo La base de datos ha sido migrada a AWS RDS
echo.
echo 📋 Configuración:
echo   Host: %PGHOST%
echo   Puerto: %PGPORT%
echo   Base de datos: campus_parking
echo   Usuario: postgres
echo.
echo 🔧 Próximos pasos:
echo   1. Verificar que tu .env tenga las credenciales correctas
echo   2. Ejecutar: npm run start:dev
echo   3. Probar endpoints en Postman/Thunder Client
echo.
echo ⚠️  RECORDATORIOS DE SEGURIDAD:
echo   - Cambiar contraseña de postgres en producción
echo   - Configurar Security Groups para IPs específicas
echo   - Habilitar SSL/TLS para conexiones
echo   - Configurar backups automáticos en RDS
echo.

pause
