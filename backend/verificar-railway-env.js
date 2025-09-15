// Script para verificar variables de entorno en Railway
console.log('🔍 Verificando variables de entorno en Railway...\n');

console.log('📋 Variables de entorno disponibles:');
console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  - PORT: ${process.env.PORT}`);
console.log(`  - DB_HOST: ${process.env.DB_HOST}`);
console.log(`  - DB_USER: ${process.env.DB_USER}`);
console.log(`  - DB_NAME: ${process.env.DB_NAME}`);
console.log(`  - DB_PORT: ${process.env.DB_PORT}`);
console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? 'Presente' : 'Ausente'}`);

// Verificar si estamos en Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
console.log(`\n🚂 ¿Ejecutándose en Railway?: ${isRailway ? 'SÍ' : 'NO'}`);

if (process.env.DATABASE_URL) {
  console.log('\n🔗 DATABASE_URL encontrada (Railway):');
  const url = process.env.DATABASE_URL;
  // Ocultar la contraseña por seguridad
  const maskedUrl = url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  console.log(`  - ${maskedUrl}`);
}

console.log('\n📊 Resumen:');
console.log(`  - Host configurado: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  - Base de datos configurada: ${process.env.DB_NAME || 'produccion_sharo'}`);
console.log(`  - ¿Tiene DATABASE_URL?: ${process.env.DATABASE_URL ? 'SÍ' : 'NO'}`);

process.exit(0);
