# 🔓 Permitir Conexiones desde Cualquier IP a AWS RDS

## ⚠️ ADVERTENCIA DE SEGURIDAD

Permitir conexiones desde **cualquier IP (0.0.0.0/0)** expone tu base de datos públicamente en Internet.

**Riesgos**:
- ❌ Ataques de fuerza bruta
- ❌ Intentos de acceso no autorizados
- ❌ Exposición de datos sensibles
- ❌ Mayor superficie de ataque

**Usar SOLO para**:
- ✅ Desarrollo temporal
- ✅ Testing rápido
- ✅ Demos/presentaciones

**NUNCA para**:
- ❌ Producción
- ❌ Datos reales de usuarios
- ❌ Información sensible

---

## 🔧 Configuración Manual en AWS Console

### Paso 1: Acceder a RDS

1. Ir a [AWS Console](https://console.aws.amazon.com/)
2. Navegar a: **Services** → **RDS** → **Databases**
3. Clic en tu instancia: `database-1`

### Paso 2: Modificar Security Group

1. En la pestaña **Connectivity & security**
2. En la sección **Security**, clic en el **VPC security group** activo
   - Ejemplo: `sg-xxxxxxxxx (default)`
3. Se abrirá la página del Security Group
4. Clic en pestaña **Inbound rules**
5. Clic en botón **Edit inbound rules**

### Paso 3: Agregar Regla para Todas las IPs

Clic en **Add rule** y configurar:

```
Type:        PostgreSQL
Protocol:    TCP
Port range:  5432
Source:      Custom | 0.0.0.0/0
Description: Temporal - Permitir todas las IPs (DESARROLLO)
```

6. Clic en **Save rules**

### Paso 4: Verificar Public Access

1. Volver a **RDS** → **Databases** → `database-1`
2. En **Connectivity & security**, verificar:
   - **Publicly accessible**: Yes ✅
   
3. Si está en "No", hacer clic en **Modify**:
   - Scroll hasta **Connectivity**
   - En **Public access**, seleccionar **Publicly accessible**
   - Clic en **Continue**
   - Seleccionar **Apply immediately**
   - Clic en **Modify DB instance**

---

## 🤖 Configuración Automática con AWS CLI

Si tienes AWS CLI configurado:

```bash
# 1. Obtener el Security Group de la instancia RDS
SG_ID=$(aws rds describe-db-instances \
  --db-instance-identifier database-1 \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# 2. Agregar regla para permitir PostgreSQL desde cualquier IP
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --group-name "Permitir PostgreSQL desde cualquier IP (DESARROLLO)"

# 3. Verificar la regla
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --query 'SecurityGroups[0].IpPermissions'

# 4. Hacer la instancia públicamente accesible (si no lo está)
aws rds modify-db-instance \
  --db-instance-identifier database-1 \
  --publicly-accessible \
  --apply-immediately
```

---

## 🧪 Probar Conexión Después de Configurar

Espera 1-2 minutos para que los cambios se apliquen, luego:

```bash
# Linux/macOS/Git Bash
export PGPASSWORD=root1234
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -c "SELECT version();"
```

```cmd
REM Windows CMD
set PGPASSWORD=root1234
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();"
```

### ✅ Respuesta Esperada

```
                                                 version
---------------------------------------------------------------------------------------------------------
 PostgreSQL 16.x on x86_64-pc-linux-gnu...
(1 row)
```

---

## 🚀 Ejecutar Migración

Una vez que la conexión funcione:

### Windows
```cmd
cd database
migrate-to-aws.bat
```

### Linux/macOS/Git Bash
```bash
cd database
chmod +x migrate-to-aws.sh
./migrate-to-aws.sh
```

---

## 🔒 Mejorar Seguridad Después del Desarrollo

### Opción 1: Restringir a IP Específica

```bash
# Eliminar regla 0.0.0.0/0
aws ec2 revoke-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0

# Agregar solo tu IP
MI_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr $MI_IP/32
```

### Opción 2: Restringir a Backend EC2

```bash
# Permitir solo desde Security Group del backend
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $SG_BACKEND_ID
```

### Opción 3: Hacer RDS Privado

```bash
# Modificar instancia para que NO sea públicamente accesible
aws rds modify-db-instance \
  --db-instance-identifier database-1 \
  --no-publicly-accessible \
  --apply-immediately
```

---

## 🛡️ Configuración de Seguridad Adicional

### 1. Cambiar Contraseña de postgres

```sql
-- Conectarse a RDS
psql -h database-1.cx2y06gkeke5.us-east-2.rds.amazonaws.com -U postgres -d postgres

-- Cambiar contraseña
ALTER USER postgres WITH PASSWORD 'nueva_contraseña_segura_aqui';
```

Actualizar `.env`:
```env
DATABASE_PASSWORD=nueva_contraseña_segura_aqui
```

### 2. Crear Usuario Específico para la Aplicación

```sql
-- Crear usuario solo para la app
CREATE USER campus_parking_app WITH PASSWORD 'password_seguro_123';

-- Dar permisos solo a la base de datos
GRANT ALL PRIVILEGES ON DATABASE campus_parking TO campus_parking_app;

-- Conectar a campus_parking
\c campus_parking

-- Dar permisos en las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO campus_parking_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO campus_parking_app;
```

Actualizar `.env`:
```env
DATABASE_USER=campus_parking_app
DATABASE_PASSWORD=password_seguro_123
```

### 3. Habilitar SSL/TLS

```bash
# Modificar instancia para requerir SSL
aws rds modify-db-instance \
  --db-instance-identifier database-1 \
  --db-parameter-group-name default.postgres16 \
  --apply-immediately
```

En tu aplicación NestJS (`database.module.ts`):
```typescript
ssl: {
  rejectUnauthorized: false, // Para RDS
  ca: fs.readFileSync('./rds-ca-2019-root.pem').toString()
}
```

---

## 📊 Monitoreo y Logs

### Habilitar Enhanced Monitoring

1. RDS Console → database-1 → **Modify**
2. En **Monitoring**, habilitar:
   - **Enhanced monitoring**: Yes
   - **Granularity**: 60 seconds
3. **Apply immediately**

### Ver Logs de Conexiones

```bash
# Listar logs disponibles
aws rds describe-db-log-files --db-instance-identifier database-1

# Descargar log
aws rds download-db-log-file-portion \
  --db-instance-identifier database-1 \
  --log-file-name error/postgresql.log.2025-11-27-00 \
  --output text
```

---

## 📋 Checklist de Configuración

### Para Permitir Cualquier IP:
- [ ] Security Group: Inbound rule PostgreSQL 5432 desde 0.0.0.0/0
- [ ] RDS: Publicly accessible = Yes
- [ ] VPC: Internet Gateway configurado
- [ ] Subnet: Route table con ruta a Internet Gateway
- [ ] Esperar 1-2 minutos para que se apliquen cambios

### Verificación:
- [ ] `psql -h database-1... -U postgres` conecta exitosamente
- [ ] `SELECT version()` retorna versión de PostgreSQL
- [ ] Migración se ejecuta sin errores
- [ ] Aplicación NestJS conecta correctamente

---

## 🆘 Troubleshooting

### Error: Connection timed out
```
✅ Solución: Verificar Security Group permite 0.0.0.0/0:5432
✅ Esperar 1-2 minutos después de cambiar
✅ Verificar que RDS está en estado "Available"
```

### Error: Authentication failed
```
✅ Verificar contraseña: root1234
✅ Verificar usuario: postgres
✅ Intentar resetear contraseña desde AWS Console
```

### Error: Database does not exist
```
✅ Normal - se creará durante la migración
✅ Ejecutar migrate-to-aws.bat/sh
```

---

## 🎯 Resumen

**Configuración actual necesaria**:
1. ✅ Agregar regla al Security Group: `0.0.0.0/0 → 5432`
2. ✅ Configurar RDS como "Publicly accessible"
3. ✅ Esperar 1-2 minutos
4. ✅ Probar conexión con psql
5. ✅ Ejecutar `migrate-to-aws.bat`

**Después del desarrollo**:
1. ⚠️ Cambiar Security Group a IP específica o Security Group backend
2. ⚠️ Cambiar contraseña de postgres
3. ⚠️ Crear usuario específico para la app
4. ⚠️ Considerar hacer RDS privado si backend está en AWS

---

**Estado actual**: ⏳ Esperando configuración de Security Group en AWS Console
