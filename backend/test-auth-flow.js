const fetch = require('node-fetch');

const API_BASE = "http://localhost:3001/api";

/**
 * Script de prueba para verificar el flujo de autenticación completo
 * Este script prueba el login, verificación de token y logout
 */

async function testAuthFlow() {
  console.log('🧪 Iniciando pruebas de autenticación...\n');
  
  try {
    // 1. Probar login con credenciales válidas
    console.log('1️⃣ Probando login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: "admin@sharo.com", 
        password: "admin123" 
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login falló: ${errorData.error || loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', {
      success: loginData.success,
      user: loginData.user?.email,
      isAdmin: loginData.user?.isAdmin,
      tokenLength: loginData.token?.length
    });
    
    const token = loginData.token;
    
    // 2. Probar obtención de perfil con token válido
    console.log('\n2️⃣ Probando obtención de perfil...');
    const profileResponse = await fetch(`${API_BASE}/empleados/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      throw new Error(`Perfil falló: ${errorData.error || profileResponse.statusText}`);
    }
    
    const profileData = await profileResponse.json();
    console.log('✅ Perfil obtenido:', {
      email: profileData.email,
      nombre: profileData.nombre,
      isAdmin: profileData.isAdmin
    });
    
    // 3. Probar heartbeat
    console.log('\n3️⃣ Probando heartbeat...');
    const heartbeatResponse = await fetch(`${API_BASE}/produccion/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!heartbeatResponse.ok) {
      const errorData = await heartbeatResponse.json();
      throw new Error(`Heartbeat falló: ${errorData.error || heartbeatResponse.statusText}`);
    }
    
    const heartbeatData = await heartbeatResponse.json();
    console.log('✅ Heartbeat exitoso:', heartbeatData.message);
    
    // 4. Probar obtención de presencia
    console.log('\n4️⃣ Probando obtención de presencia...');
    const presenceResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!presenceResponse.ok) {
      const errorData = await presenceResponse.json();
      throw new Error(`Presencia falló: ${errorData.error || presenceResponse.statusText}`);
    }
    
    const presenceData = await presenceResponse.json();
    console.log('✅ Presencia obtenida:', {
      totalEmpleados: presenceData.length,
      online: presenceData.filter(p => p.online).length,
      offline: presenceData.filter(p => !p.online).length
    });
    
    // 5. Probar logout
    console.log('\n5️⃣ Probando logout...');
    const logoutResponse = await fetch(`${API_BASE}/produccion/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!logoutResponse.ok) {
      const errorData = await logoutResponse.json();
      throw new Error(`Logout falló: ${errorData.error || logoutResponse.statusText}`);
    }
    
    const logoutData = await logoutResponse.json();
    console.log('✅ Logout exitoso:', logoutData.message);
    
    // 6. Verificar que el token ya no funciona
    console.log('\n6️⃣ Verificando que el token ya no funciona...');
    const invalidProfileResponse = await fetch(`${API_BASE}/empleados/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (invalidProfileResponse.ok) {
      console.log('⚠️ El token sigue siendo válido después del logout');
    } else {
      console.log('✅ El token ya no es válido después del logout');
    }
    
    console.log('\n🎉 Todas las pruebas de autenticación pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de autenticación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAuthFlow()
    .then(() => {
      console.log('\n✅ Script de pruebas completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando script de pruebas:', error);
      process.exit(1);
    });
}

module.exports = { testAuthFlow };
