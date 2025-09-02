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

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Permitir localhost para desarrollo
    if (origin.includes('localhost')) return callback(null, true);
    
    // Permitir cualquier dominio de Vercel
    if (origin.includes('.vercel.app')) return callback(null, true);
    
    // Permitir cualquier dominio de Netlify
    if (origin.includes('.netlify.app')) return callback(null, true);
    
    // Permitir el dominio específico de la aplicación
    if (origin === 'https://sistema-de-produccion-sharo.vercel.app') return callback(null, true);
    
    // Rechazar otros orígenes
    callback(new Error('No permitido por CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static('uploads'));

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