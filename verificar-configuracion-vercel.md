# 🔧 CONFIGURACIÓN OBLIGATORIA EN VERCEL

## 📋 CHECKLIST DE CONFIGURACIÓN:

### ✅ 1. ROOT DIRECTORY (CRÍTICO)
- **Ubicación**: Settings → General → Root Directory
- **Valor requerido**: `frontend`
- **¿Por qué?**: Vercel necesita saber dónde está el código del frontend

### ✅ 2. BUILD COMMAND
- **Ubicación**: Settings → General → Build Command
- **Valor requerido**: `npm run build` (o vacío)
- **¿Por qué?**: Para compilar el frontend

### ✅ 3. OUTPUT DIRECTORY
- **Ubicación**: Settings → General → Output Directory
- **Valor requerido**: `dist` (o vacío)
- **¿Por qué?**: Donde Vercel encuentra los archivos compilados

### ✅ 4. INSTALL COMMAND
- **Ubicación**: Settings → General → Install Command
- **Valor requerido**: `npm install` (o vacío)
- **¿Por qué?**: Para instalar dependencias

### ✅ 5. ENVIRONMENT VARIABLES
- **Ubicación**: Settings → Environment Variables
- **Verificar que NO haya**:
  - `VITE_API_URL` configurada
  - Cualquier variable que apunte a Railway

### ✅ 6. FUNCTIONS
- **Ubicación**: Settings → Functions
- **Runtime**: Node.js 18.x o superior
- **No debe haber configuraciones** que interfieran

## 🚨 PROBLEMAS COMUNES:

### ❌ ROOT DIRECTORY INCORRECTO
- **Síntoma**: Vercel no encuentra `vercel.json`
- **Solución**: Configurar Root Directory como `frontend`

### ❌ VARIABLES DE ENTORNO CONFLICTIVAS
- **Síntoma**: Frontend usa URL incorrecta
- **Solución**: Eliminar `VITE_API_URL` de Vercel

### ❌ CONFIGURACIÓN DE FUNCTIONS INCORRECTA
- **Síntoma**: Proxy no funciona
- **Solución**: Usar Node.js 18.x o superior

## 🎯 CONFIGURACIÓN RECOMENDADA:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://sistema-de-produccion-sharodesings-production.up.railway.app/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

## 📝 INSTRUCCIONES:

1. **Ve a Vercel Dashboard**
2. **Selecciona tu proyecto**
3. **Verifica cada configuración** de la lista
4. **Haz clic en "Redeploy"** después de cualquier cambio
5. **Espera 5-10 minutos** para que se apliquen los cambios
