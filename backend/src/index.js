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
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Inicializar base de datos y servidor
async function initializeServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🔧 CORS configurado para Railway - v3.0 - FORZADO');
    
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