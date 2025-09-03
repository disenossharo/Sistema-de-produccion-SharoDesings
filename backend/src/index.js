require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, createTables } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const produccionRoutes = require('./routes/produccionRoutes');
const referenciasRoutes = require('./routes/referenciasRoutes');
const operacionesRoutes = require('./routes/operacionesRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS personalizado - Railway compatible
app.use((req, res, next) => {
  // Permitir todos los orígenes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Middleware adicional para forzar CORS después de las rutas
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
app.use(express.json());
app.use(express.static('uploads'));

// Middleware final para sobrescribir headers de Railway
app.use((req, res, next) => {
  // Forzar headers CORS en cada respuesta
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  next();
});

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/referencias', referenciasRoutes);
app.use('/api/operaciones', operacionesRoutes);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente - v11.0 REDESPLEGADO',
    timestamp: new Date().toISOString(),
    version: 'v11.0'
  });
});

// Endpoint de debug
app.get('/debug', (req, res) => {
  res.json({
    status: 'OK',
    version: 'v6.0 - CONFIGURACIÓN CORREGIDA',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
      DB_PORT: process.env.DB_PORT ? 'SET' : 'NOT SET',
      DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET',
      DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    },
    routes: [
      'GET /health',
      'GET /debug',
      'GET /test',
      'GET /api/test',
      'POST /api/auth/login',
      'GET /api/empleados',
      'GET /api/produccion',
      'GET /api/referencias'
    ]
  });
});

// Ruta de prueba simple
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Ruta de prueba funcionando',
    timestamp: new Date().toISOString(),
    routes: [
      '/health',
      '/test',
      '/api/auth/login',
      '/api/empleados',
      '/api/produccion'
    ]
  });
});

// Ruta de prueba para API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API de prueba funcionando',
    timestamp: new Date().toISOString()
  });
});

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Verificar que las rutas estén registradas
console.log('📋 Rutas registradas:');
console.log('- /api/auth/*');
console.log('- /api/empleados/*');
console.log('- /api/produccion/*');
console.log('- /api/referencias/*');
console.log('- /api/operaciones/*');

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Ruta no encontrada', 
    method: req.method, 
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/empleados',
      'GET /api/produccion',
      'GET /api/referencias'
    ]
  });
});

// Inicializar base de datos y servidor
async function initializeServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🔧 CORS configurado para Railway - v11.0 - FORZANDO REDESPLIEGUE');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🔍 Railway debería mostrar este mensaje en los logs');
    console.log('⚠️  CORS_ORIGIN eliminado de Railway para evitar conflictos');
    console.log('🔧 Usando npm install para instalar dependencias');
    
    // Probar conexión a PostgreSQL
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ No se pudo conectar a PostgreSQL. Verifica la configuración.');
      process.exit(1);
    }

    // Crear tablas si no existen
    await createTables();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
      console.log(`📊 Base de datos PostgreSQL conectada exitosamente`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error inicializando el servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
initializeServer(); 