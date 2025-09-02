# 🚀 Guía de Despliegue - Sistema de Producción Sharo Designs

## 🏢 **Empresa**
**Sharo Designs** - Sistema de gestión de producción textil

## 📋 Resumen

Esta guía te ayudará a desplegar el **Sistema de Producción Sharo Designs** en producción usando:
- **Vercel** para el frontend (React)
- **Railway** para el backend (Node.js) y base de datos (PostgreSQL)

## 🌐 URLs de Producción

Una vez desplegado, tu aplicación estará disponible en:
- **Frontend**: `https://sistema-produccion-sharo.vercel.app`
- **Backend**: `https://sharo-backend-production.railway.app`
- **API**: `https://sharo-backend-production.railway.app/api`

## 🎯 PASO 1: Desplegar Backend en Railway

### 1.1 Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Regístrate con tu cuenta de GitHub
3. Autoriza el acceso a tu repositorio

### 1.2 Conectar repositorio
1. En Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona: `disenossharo/Sistema-de-produccion-SharoDesings`
4. Railway detectará automáticamente que es un proyecto Node.js

### 1.3 Configurar variables de entorno
En Railway, ve a la pestaña "Variables" y agrega:

```env
PORT=3001
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=tu_password_de_railway
JWT_SECRET=tu_jwt_secret_super_seguro
NODE_ENV=production
```

**Nota**: Railway te proporcionará automáticamente las variables de la base de datos.

### 1.4 Agregar base de datos PostgreSQL
1. En tu proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia las variables de entorno de la base de datos

### 1.5 Configurar el build
Railway detectará automáticamente que debe ejecutar:
```bash
cd backend && npm install && npm start
```

## 🎨 PASO 2: Desplegar Frontend en Vercel

### 2.1 Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub
3. Autoriza el acceso a tu repositorio

### 2.2 Importar proyecto
1. En Vercel, haz clic en "New Project"
2. Busca y selecciona: `disenossharo/Sistema-de-produccion-SharoDesings`
3. Vercel detectará automáticamente la configuración de `vercel.json`

### 2.3 Configurar variables de entorno
En Vercel, ve a "Settings" → "Environment Variables" y agrega:

```env
VITE_API_URL=https://sharo-backend-production.railway.app/api
```

### 2.4 Configurar build
Vercel usará automáticamente:
- **Framework Preset**: Vite
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

## 🔧 PASO 3: Configurar CORS en el Backend

Una vez que tengas la URL de tu frontend en Vercel, actualiza el CORS en el backend:

1. Ve a Railway → tu proyecto → "Variables"
2. Agrega una nueva variable:
```env
FRONTEND_URL=https://tu-app.vercel.app
```

3. Actualiza el archivo `backend/src/index.js` para usar esta variable:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
```

4. Haz commit y push de los cambios:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

Railway detectará automáticamente los cambios y redesplegará.

## 🧪 PASO 4: Probar el despliegue

### 4.1 Verificar backend
Visita: `https://tu-backend.railway.app/health`
Deberías ver: `{"status":"OK","message":"Servidor funcionando correctamente"}`

### 4.2 Verificar frontend
Visita: `https://tu-app.vercel.app`
Deberías ver la página de login.

### 4.3 Probar login
Usa las credenciales de prueba:
- **Admin**: `admin@sharo.com` / `admin123`
- **Empleado**: `empleado1@sharo.com` / `empleado123`

## 🔄 PASO 5: Actualizaciones futuras

Para actualizar tu aplicación:

1. Haz los cambios en tu código local
2. Haz commit y push:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

3. **Vercel** y **Railway** detectarán automáticamente los cambios y redesplegarán.

## 🛠️ Solución de problemas

### Error de CORS
- Verifica que `FRONTEND_URL` esté configurada correctamente en Railway
- Asegúrate de que la URL del frontend esté en la lista de orígenes permitidos

### Error de base de datos
- Verifica que las variables de entorno de la base de datos estén correctas
- Asegúrate de que la base de datos esté ejecutándose en Railway

### Error de build
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel/Railway

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Railway y Vercel
2. Verifica las variables de entorno
3. Asegúrate de que el repositorio esté actualizado

## 🏢 **Información de la Empresa**

**Sharo Designs**
- **Email**: disenossharo1302@gmail.com
- **Repositorio**: [Sistema-de-produccion-SharoDesings](https://github.com/disenossharo/Sistema-de-produccion-SharoDesings)
- **Desarrollador**: Jermix8 (Prácticas Profesionales)
- **Email del desarrollador**: 8jermix@gmail.com

## 🎉 ¡Listo!

Tu aplicación estará funcionando en producción y accesible desde cualquier lugar del mundo.
