# ✅ Checklist de Configuración

Usa esta lista para verificar que todo está configurado correctamente.

## Prerequisitos

- [ ] PostgreSQL 13+ instalado
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Editor de código (VS Code recomendado)

## Configuración Inicial

- [ ] Repositorio clonado
- [ ] `npm install` ejecutado sin errores
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] PostgreSQL corriendo (verificar con `psql --version`)

## Base de Datos

- [ ] Base de datos `campus_parking` creada
- [ ] Script `setup.sql` ejecutado sin errores
- [ ] Aplicación iniciada con `npm run start:dev`
- [ ] Tablas creadas automáticamente por TypeORM:
  - [ ] conductores
  - [ ] vehiculos
  - [ ] parqueaderos
- [ ] (Opcional) Datos de prueba insertados

## Verificación

- [ ] API responde en `http://localhost:3000`
- [ ] Endpoint `/conductor` funciona
- [ ] Endpoint `/vehiculo` funciona
- [ ] Endpoint `/parqueadero` funciona

## Estructura Verificada

- [ ] Tabla `conductores` usa `codigo` como PRIMARY KEY
- [ ] Tabla `vehiculos` usa `placa` como PRIMARY KEY
- [ ] Relación `vehiculos.conductorCodigo` → `conductores.codigo` existe
- [ ] Códigos de conductor son de 10 dígitos (ej: `0000028906`)
- [ ] Correos tienen dominio `@ucaldas.edu.co`

## Problemas Comunes Resueltos

- [ ] Si psql no funciona: PATH configurado correctamente
- [ ] Si hay errores de conexión: Credenciales verificadas
- [ ] Si las tablas no se crean: `synchronize: true` activado en desarrollo
- [ ] Si hay conflictos de puerto: Puerto 3000 libre o cambiado en `.env`

## Listo para Trabajar

Si todos los checks están marcados ✅, ¡estás listo para desarrollar!

---

**Nota:** Si encuentras algún problema, consulta:
1. `database/README.md` - Documentación completa
2. `database/INICIO-RAPIDO.md` - Guía rápida
3. `CONFIGURACION-BD.md` - Guía de configuración detallada
