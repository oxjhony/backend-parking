# Guía de Pruebas - Backend Parking

## 📋 Tabla de Contenidos
- [Configuración Inicial](#configuración-inicial)
- [Pruebas Unitarias](#pruebas-unitarias)
- [Pruebas E2E](#pruebas-e2e)
- [Ejecutar Todas las Pruebas](#ejecutar-todas-las-pruebas)
- [Cobertura de Código](#cobertura-de-código)
- [Resultados Actuales](#resultados-actuales)

## 🚀 Configuración Inicial

Antes de ejecutar las pruebas, asegúrate de tener:

1. **Base de datos configurada y corriendo**
   ```bash
   # Iniciar PostgreSQL (Windows)
   net start postgresql-x64-17
   ```

2. **Dependencias instaladas**
   ```bash
   npm install
   ```

3. **Variables de entorno configuradas**
   - Copia `.env.example` a `.env`
   - Ajusta las credenciales de la base de datos

4. **Base de datos con datos de prueba**
   ```bash
   # Recrear la base de datos
   psql -U postgres -p 5433 -f database/setup.sql
   
   # Insertar datos de prueba
   psql -U postgres -p 5433 -d campus_parking -f database/datos-prueba.sql
   ```

## 🧪 Pruebas Unitarias

### Ejecutar todas las pruebas unitarias
```bash
npm test
```

### Ejecutar pruebas específicas del módulo de registro
```bash
npm test -- registro.service.spec.ts
```

### Ejecutar pruebas con cobertura
```bash
npm test -- --coverage
```

### Ejecutar en modo watch (desarrollo)
```bash
npm test -- --watch
```

## 🌐 Pruebas E2E (End-to-End)

### Ejecutar todas las pruebas e2e
```bash
npm run test:e2e
```

### Ejecutar pruebas e2e del módulo de registro
```bash
npm run test:e2e -- registro-entrada.e2e-spec.ts
```

### Ejecutar con timeout extendido
```bash
npm run test:e2e -- registro-entrada.e2e-spec.ts --testTimeout=10000
```

### Ejecutar con logs detallados
```bash
npm run test:e2e -- registro-entrada.e2e-spec.ts --verbose
```

## 🎯 Ejecutar Todas las Pruebas

Para ejecutar el conjunto completo de pruebas:

```bash
# Pruebas unitarias + e2e
npm run test:all

# O ejecutar por separado
npm test && npm run test:e2e
```

## 📊 Cobertura de Código

### Generar reporte de cobertura
```bash
npm test -- --coverage
```

### Ver reporte HTML
```bash
npm test -- --coverage --coverageReporters=html
# El reporte se generará en: coverage/index.html
```

### Cobertura solo de un módulo
```bash
npm test -- registro.service.spec.ts --coverage
```

## 📈 Resultados Actuales

### Pruebas Unitarias - Módulo de Registro
**Estado:** ✅ 16/16 PASANDO (100%)

**Cobertura:**
- ✅ Validación de formato de placa
- ✅ Control de duplicados
- ✅ Validación de campos obligatorios
- ✅ Estado ACTIVO y persistencia
- ✅ Validación de capacidad del parqueadero
- ✅ Decrementar cupos disponibles

**Ejecutar:**
```bash
npm test -- registro.service.spec.ts
```

### Pruebas E2E - Registro de Entrada Manual
**Estado:** 🟡 18/20 PASANDO (90%)

**Casos de prueba:**

#### ✅ Criterio 1: Validación de formato de placa (4/4)
- ✅ Aceptar formato válido ABC123 para carro
- ✅ Aceptar formato válido XYZ78A para moto
- ✅ Rechazar placa vacía
- ✅ Rechazar placa inexistente

#### ✅ Criterio 2: Control de duplicados (2/2)
- ✅ Rechazar entrada si vehículo ya está activo
- ✅ Permitir nueva entrada después de registrar salida

#### ✅ Criterio 3: Validación de campos obligatorios (5/5)
- ✅ Rechazar request sin vehiculoPlaca
- ✅ Rechazar request sin usuarioId
- ✅ Rechazar request sin parqueaderoId
- ✅ Rechazar usuarioId inexistente
- ✅ Rechazar parqueaderoId inexistente

#### ✅ Criterio 4: Guardar con estado ACTIVO (2/2)
- ✅ Guardar registro con estado ACTIVO
- ✅ Registrar hora de entrada automáticamente

#### ✅ Criterio 5: Validación de capacidad (2/2)
- ✅ Rechazar si no hay cupos disponibles
- ✅ Decrementar cupos después del registro

#### 🟡 Criterio 6: Visualización (1/3)
- ✅ Incluir nuevo registro en la lista
- ❌ Mostrar solo registros activos (filtro por query param)
- ❌ Consultar registro específico con relaciones cargadas

#### ✅ Escenarios de error (2/2)
- ✅ Mensaje claro cuando parqueadero está lleno
- ✅ Estructura de error consistente

**Ejecutar:**
```bash
npm run test:e2e -- registro-entrada.e2e-spec.ts --testTimeout=10000
```

### Issues Conocidos

#### ❌ Filtro por estado en GET /registro
**Problema:** El endpoint no filtra correctamente por query param `estado=ACTIVO`  
**Test afectado:** `GET /registro?estado=ACTIVO - debe mostrar solo registros activos`  
**Prioridad:** Media  
**Solución requerida:** Implementar filtro en `registro.controller.ts`

#### ❌ Relaciones no cargadas en GET /registro/:id
**Problema:** El endpoint no carga las relaciones (vehiculo, usuario, parqueadero)  
**Test afectado:** `GET /registro/:id - debe permitir consultar un registro específico`  
**Prioridad:** Media  
**Solución requerida:** Agregar `relations` en `registro.service.ts findOne()`

## 🔧 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
sc query postgresql-x64-17

# Si no está corriendo, iniciarlo (como administrador)
net start postgresql-x64-17
```

### Error: "Usuario no encontrado" en pruebas e2e
```bash
# Asegurarse de que los datos de prueba estén insertados
psql -U postgres -p 5433 -d campus_parking -f database/datos-prueba.sql
```

### Error: "Port 3000 already in use"
```bash
# Detener la aplicación que está usando el puerto
# O cambiar el puerto en .env
PORT=3001
```

### Timeout en pruebas e2e
```bash
# Aumentar el timeout
npm run test:e2e -- registro-entrada.e2e-spec.ts --testTimeout=30000
```

## 📝 Convenciones de Pruebas

### Nomenclatura de archivos
- Pruebas unitarias: `*.spec.ts`
- Pruebas e2e: `*.e2e-spec.ts`

### Estructura de pruebas
```typescript
describe('Nombre del módulo o funcionalidad', () => {
  beforeEach(() => {
    // Setup antes de cada prueba
  });

  describe('Criterio/Escenario específico', () => {
    it('debe hacer algo específico', () => {
      // Arrange (preparar)
      // Act (ejecutar)
      // Assert (verificar)
    });
  });
});
```

### Datos de prueba
- Usuario vigilante: `juan.perez@example.com` / `1234`
- Usuario admin: `admin@ucaldas.edu.co` / `admin1234`
- Usuario superusuario: `superusuario@ucaldas.edu.co` / `admin1234`

## 🎓 Recursos Adicionales

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Testing en NestJS](https://docs.nestjs.com/fundamentals/testing)
- [Supertest para E2E](https://github.com/visionmedia/supertest)
