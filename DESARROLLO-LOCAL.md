# 🚀 Configuración para Desarrollo Local

## Problema Resuelto
El error 502 (Bad Gateway) en localhost se debe a que el frontend intenta conectarse al backend, pero el backend no está corriendo localmente.

## ✅ Solución Implementada

### 1. Configuración de Proxy Automática
- **Vite** ahora detecta automáticamente si estás en desarrollo o producción
- **Desarrollo**: Se conecta a `http://localhost:3001` (backend local)
- **Producción**: Se conecta a Railway (backend en la nube)

### 2. Scripts de Desarrollo
He creado scripts para facilitar el desarrollo:

#### Windows (CMD):
```bash
start-dev.bat
```

#### Windows (PowerShell):
```powershell
.\start-dev.ps1
```

## 🔧 Configuración Manual

### 1. Backend (Puerto 3001)
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (Puerto 5173)
```bash
cd frontend
npm install
npm run dev
```

## 📋 Configuración de Base de Datos

### Opción 1: Base de Datos Local
1. Instala PostgreSQL localmente
2. Crea una base de datos llamada `produccion_sharo`
3. Crea un archivo `.env` en la carpeta `backend` con:

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=produccion_sharo
DB_PORT=5432
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_jwt_secret_muy_seguro
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAILS=admin@sharo.com
```

### Opción 2: Usar la Base de Datos de Railway
1. Copia las variables de entorno de Railway
2. Crea un archivo `.env` en la carpeta `backend` con esas variables
3. Cambia `NODE_ENV=development` y `CORS_ORIGIN=http://localhost:5173`

## 🎯 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Test**: http://localhost:3001/api/test

## 🔍 Verificación

1. Ejecuta el script de desarrollo
2. Abre http://localhost:5173
3. Intenta hacer login
4. Debería funcionar sin errores 502

## 🚨 Notas Importantes

- **No afecta la producción**: Los cambios solo afectan el desarrollo local
- **Base de datos**: Puedes usar la misma base de datos de Railway o una local
- **Puertos**: Backend en 3001, Frontend en 5173
- **CORS**: Configurado para permitir localhost:5173

## 🆘 Solución de Problemas

### Error 502 persistente:
1. Verifica que el backend esté corriendo en puerto 3001
2. Revisa la consola del backend para errores
3. Verifica que la base de datos esté conectada

### Error de CORS:
1. Verifica que `CORS_ORIGIN` incluya `http://localhost:5173`
2. Reinicia el backend después de cambiar variables de entorno

### Base de datos no conecta:
1. Verifica las credenciales en el archivo `.env`
2. Asegúrate de que PostgreSQL esté corriendo
3. Verifica que la base de datos `produccion_sharo` exista
