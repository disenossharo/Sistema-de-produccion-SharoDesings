const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');

/**
 * Script para crear usuario administrador inicial
 * Este script crea un usuario administrador por defecto si no existe ninguno
 */
async function createAdminUser() {
    const client = await pool.connect();
    try {
        console.log('🔍 Verificando si existe usuario administrador...');
        
        // Verificar si ya existe un admin
        const existingAdmin = await client.query(
            'SELECT * FROM empleados WHERE is_admin = true'
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('✅ Usuario administrador ya existe');
            console.log(`📧 Email del admin: ${existingAdmin.rows[0].email}`);
            return;
        }
        
        console.log('👤 Creando usuario administrador inicial...');
        
        // Crear hash de la contraseña
        const password = 'admin123'; // Contraseña por defecto - CAMBIAR EN PRODUCCIÓN
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Insertar usuario administrador
        await client.query(`
            INSERT INTO empleados (
                email, 
                nombre, 
                apellidos, 
                cargo_maquina, 
                password_hash, 
                is_admin, 
                activo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'admin@sharo.com',
            'Administrador',
            'Sistema',
            'Supervisor',
            passwordHash,
            true,
            true
        ]);
        
        console.log('✅ Usuario administrador creado exitosamente');
        console.log('📧 Email: admin@sharo.com');
        console.log('🔑 Contraseña: admin123');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
        console.log('🔒 Para mayor seguridad, modifica estas credenciales en producción');
        
    } catch (error) {
        console.error('❌ Error creando usuario administrador:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Función para crear múltiples usuarios de prueba
 * Útil para desarrollo y testing
 */
async function createTestUsers() {
    const client = await pool.connect();
    try {
        console.log('👥 Creando usuarios de prueba...');
        
        const testUsers = [
            {
                email: 'empleado1@sharo.com',
                nombre: 'Juan',
                apellidos: 'Pérez',
                cargo_maquina: 'Operador Máquina 1',
                password: 'empleado123'
            },
            {
                email: 'empleado2@sharo.com',
                nombre: 'María',
                apellidos: 'García',
                cargo_maquina: 'Operador Máquina 2',
                password: 'empleado123'
            },
            {
                email: 'supervisor@sharo.com',
                nombre: 'Carlos',
                apellidos: 'López',
                cargo_maquina: 'Supervisor',
                password: 'supervisor123'
            }
        ];
        
        for (const user of testUsers) {
            // Verificar si el usuario ya existe
            const existingUser = await client.query(
                'SELECT * FROM empleados WHERE email = $1',
                [user.email]
            );
            
            if (existingUser.rows.length > 0) {
                console.log(`⚠️  Usuario ${user.email} ya existe, saltando...`);
                continue;
            }
            
            // Crear hash de la contraseña
            const passwordHash = await bcrypt.hash(user.password, 10);
            
            // Insertar usuario
            await client.query(`
                INSERT INTO empleados (
                    email, 
                    nombre, 
                    apellidos, 
                    cargo_maquina, 
                    password_hash, 
                    is_admin, 
                    activo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                user.email,
                user.nombre,
                user.apellidos,
                user.cargo_maquina,
                passwordHash,
                user.email === 'supervisor@sharo.com', // Supervisor es admin
                true
            ]);
            
            console.log(`✅ Usuario creado: ${user.email}`);
        }
        
        console.log('🎉 Usuarios de prueba creados exitosamente');
        
    } catch (error) {
        console.error('❌ Error creando usuarios de prueba:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Función principal que ejecuta la inicialización
 */
async function initializeDatabase() {
    try {
        console.log('🚀 Inicializando base de datos...');
        
        // Crear usuario administrador
        await createAdminUser();
        
        // Preguntar si crear usuarios de prueba (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.question('¿Crear usuarios de prueba? (y/N): ', async (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    await createTestUsers();
                }
                rl.close();
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
        
    } catch (error) {
        console.error('❌ Error en la inicialización:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = { 
    createAdminUser, 
    createTestUsers, 
    initializeDatabase 
};
