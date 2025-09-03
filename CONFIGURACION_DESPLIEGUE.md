# 🚀 CONFIGURACIÓN DE DESPLIEGUE - SISTEMA SHARO

## 📋 CONFIGURACIÓN COMPLETA

### ===== CONFIGURACIÓN DE RAILWAY (BACKEND) =====

**Variables que DEBEN estar en Railway:**
```
PORT=3001
DB_HOST=postgres.railway.internal
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=TvmwCkbawsIfojLkateYDtsZNsXGEMVi
JWT_SECRET=d794144d866d54fa1b2a77d7a0960234152d4ecb7876a11d6dffdf476b0948296de92a98d7e1d2a5b51beeaccef02ea83f6f7ac81
NODE_ENV=production
```

**URL del backend en Railway:**
```
https://sistema-de-produccion-sharodesings-production.up.railway.app
```

### ===== CONFIGURACIÓN DE VERCEL (FRONTEND) =====

**Variables que DEBEN estar en Vercel:**
```
VITE_API_URL=/api
```

**Configuración del proyecto en Vercel:**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**URL del frontend en Vercel:**
```
https://sistema-de-produccion-sharo.vercel.app
```

### ===== CONFIGURACIÓN DE CORS =====

**IMPORTANTE**: NO configurar `CORS_ORIGIN` en Railway (dejar vacío para evitar conflictos)

## 🎯 PLAN DE DESPLIEGUE PASO A PASO

### **PASO 1: LIMPIAR CONFIGURACIÓN ACTUAL**
1. Eliminar todas las variables de entorno en Railway
2. Eliminar todas las variables de entorno en Vercel
3. Limpiar configuración de Root Directory en Vercel

### **PASO 2: CONFIGURAR RAILWAY**
1. Agregar variables de entorno una por una
2. Verificar que el backend funcione
3. Probar endpoints directamente

### **PASO 3: CONFIGURAR VERCEL**
1. Configurar Root Directory como `frontend`
2. Agregar variable `VITE_API_URL=/api`
3. Verificar que el frontend se construya correctamente

### **PASO 4: PROBAR CONEXIÓN**
1. Probar login en la aplicación
2. Verificar que el proxy funcione
3. Confirmar que todo esté funcionando

## 📝 INSTRUCCIONES DETALLADAS

### **Para Railway:**
1. Ve a Railway Dashboard
2. Selecciona tu proyecto backend
3. Ve a "Variables"
4. Elimina TODAS las variables existentes
5. Agrega las variables una por una según la lista de arriba

### **Para Vercel:**
1. Ve a Vercel Dashboard
2. Selecciona tu proyecto frontend
3. Ve a "Settings" → "General"
4. Configura Root Directory como `frontend`
5. Ve a "Environment Variables"
6. Elimina TODAS las variables existentes
7. Agrega `VITE_API_URL` con valor `/api`

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Railway: Variables configuradas correctamente
- [ ] Railway: Backend funcionando (health check)
- [ ] Vercel: Root Directory configurado como `frontend`
- [ ] Vercel: Variable `VITE_API_URL=/api` configurada
- [ ] Vercel: Frontend se construye correctamente
- [ ] Conexión: Login funciona en la aplicación
- [ ] Proxy: Vercel redirige a Railway correctamente
