const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function populateDatabase() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // Verificar conexión
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Crear usuarios de prueba
    const testUsers = [
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@sharo.com',
        password: 'admin123',
        rol: 'admin',
        telefono: '1234567890',
        direccion: 'Calle Principal 123',
        fecha_nacimiento: '1990-01-01',
        salario: 5000.00,
        fecha_contratacion: '2024-01-01',
        estado: 'activo'
      },
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@sharo.com',
        password: 'juan123',
        rol: 'empleado',
        telefono: '0987654321',
        direccion: 'Avenida Central 456',
        fecha_nacimiento: '1985-05-15',
        salario: 3000.00,
        fecha_contratacion: '2024-02-01',
        estado: 'activo'
      },
      {
        nombre: 'María',
        apellido: 'García',
        email: 'maria@sharo.com',
        password: 'maria123',
        rol: 'empleado',
        telefono: '1122334455',
        direccion: 'Plaza Mayor 789',
        fecha_nacimiento: '1988-12-10',
        salario: 3200.00,
        fecha_contratacion: '2024-03-01',
        estado: 'activo'
      }
    ];

    console.log('🔄 Creando usuarios de prueba...');
    
    for (const user of testUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await client.query(
        'SELECT id FROM empleados WHERE email = $1',
        [user.email]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`⚠️  Usuario ${user.email} ya existe, saltando...`);
        continue;
      }
      
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Insertar usuario
      const result = await client.query(
        `INSERT INTO empleados (
          nombre, apellido, email, password, rol, telefono, 
          direccion, fecha_nacimiento, salario, fecha_contratacion, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING id, nombre, apellido, email, rol`,
        [
          user.nombre, user.apellido, user.email, hashedPassword, user.rol,
          user.telefono, user.direccion, user.fecha_nacimiento, user.salario,
          user.fecha_contratacion, user.estado
        ]
      );
      
      console.log(`✅ Usuario creado: ${user.nombre} ${user.apellido} (${user.email})`);
    }
    
    // Crear algunos registros de presencia de prueba
    console.log('🔄 Creando registros de presencia de prueba...');
    
    const empleados = await client.query('SELECT id FROM empleados');
    
    if (empleados.rows.length > 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      for (const empleado of empleados.rows) {
        // Verificar si ya existe registro para hoy
        const existingPresence = await client.query(
          'SELECT id FROM presencia WHERE empleado_id = $1 AND DATE(fecha_entrada) = DATE($2)',
          [empleado.id, today]
        );
        
        if (existingPresence.rows.length === 0) {
          await client.query(
            'INSERT INTO presencia (empleado_id, fecha_entrada, fecha_salida, horas_trabajadas, estado) VALUES ($1, $2, $3, $4, $5)',
            [empleado.id, today, null, 0, 'presente']
          );
          console.log(`✅ Registro de presencia creado para empleado ${empleado.id}`);
        }
      }
    }
    
    console.log('🎉 Base de datos poblada exitosamente!');
    console.log('\n📋 Usuarios creados:');
    console.log('👤 admin@sharo.com - Contraseña: admin123 (Admin)');
    console.log('👤 juan@sharo.com - Contraseña: juan123 (Empleado)');
    console.log('👤 maria@sharo.com - Contraseña: maria123 (Empleado)');
    
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  populateDatabase();
}

module.exports = populateDatabase;
