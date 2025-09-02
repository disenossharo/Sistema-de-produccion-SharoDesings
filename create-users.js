yconst { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'postgres.railway.internal',
  database: 'railway',
  password: 'TvmwCkbawsIfojLkateYDtsZNsXGEMVi',
  port: 5432,
});

async function createUsers() {
  console.log('👥 Creando usuarios de prueba...');
  
  const users = [
    { email: 'admin@sharo.com', password: 'admin123', nombre: 'Admin', apellidos: 'Sharo', cedula: '123456789', cargoMaquina: 'Administrador', isAdmin: true },
    { email: 'empleado1@sharo.com', password: 'empleado123', nombre: 'Empleado Uno', apellidos: 'Apellido Uno', cedula: '987654321', cargoMaquina: 'Corte', isAdmin: false },
    { email: 'empleado2@sharo.com', password: 'empleado123', nombre: 'Empleado Dos', apellidos: 'Apellido Dos', cedula: '112233445', cargoMaquina: 'Costura', isAdmin: false },
    { email: 'supervisor@sharo.com', password: 'supervisor123', nombre: 'Supervisor', apellidos: 'Sharo', cedula: '556677889', cargoMaquina: 'Supervisor', isAdmin: true }
  ];

  for (const userData of users) {
    const client = await pool.connect();
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const result = await client.query(
        `INSERT INTO empleados (email, nombre, apellidos, cedula, cargo_maquina, password_hash, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           apellidos = EXCLUDED.apellidos,
           cedula = EXCLUDED.cedula,
           cargo_maquina = EXCLUDED.cargo_maquina,
           password_hash = EXCLUDED.password_hash,
           is_admin = EXCLUDED.is_admin,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userData.email, userData.nombre, userData.apellidos, userData.cedula, userData.cargoMaquina, hashedPassword, userData.isAdmin]
      );
      console.log(`✅ Usuario ${userData.email} creado/actualizado`);
    } catch (error) {
      console.error(`❌ Error al crear/actualizar usuario ${userData.email}:`, error.message);
    } finally {
      client.release();
    }
  }
  
  console.log('🎉 Usuarios de prueba creados/actualizados exitosamente');
  await pool.end();
}

createUsers().catch(console.error);
