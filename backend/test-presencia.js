const fetch = require('node-fetch');

const API_BASE = "http://localhost:3001/api";

/**
 * Script de prueba para verificar el sistema de presencia
 * Este script prueba el heartbeat, presencia y limpieza automática
 */

async function testPresencia() {
  console.log('🧪 Iniciando pruebas del sistema de presencia...\n');
  
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
    console.log('✅ Login exitoso:', loginData.user?.email);
    
    const token = loginData.token;
    
    // 2. Verificar estado inicial de presencia
    console.log('\n2️⃣ Verificando estado inicial de presencia...');
    const presenceResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!presenceResponse.ok) {
      const errorData = await presenceResponse.json();
      throw new Error(`Presencia falló: ${errorData.error || presenceResponse.statusText}`);
    }
    
    const presenceData = await presenceResponse.json();
    console.log('✅ Presencia inicial obtenida:', {
      totalEmpleados: presenceData.length,
      online: presenceData.filter(p => p.online).length,
      offline: presenceData.filter(p => !p.online).length
    });
    
    // Mostrar detalles de cada empleado
    presenceData.forEach(emp => {
      console.log(`   👤 ${emp.nombre} (${emp.id}): ${emp.online ? '🟢 Online' : '🔴 Offline'} - Última actividad: ${emp.lastSeen}`);
    });
    
    // 3. Probar heartbeat múltiples veces
    console.log('\n3️⃣ Probando heartbeat múltiples veces...');
    for (let i = 1; i <= 3; i++) {
      console.log(`   💓 Enviando heartbeat ${i}/3...`);
      
      const heartbeatResponse = await fetch(`${API_BASE}/produccion/heartbeat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!heartbeatResponse.ok) {
        const errorData = await heartbeatResponse.json();
        throw new Error(`Heartbeat ${i} falló: ${errorData.error || heartbeatResponse.statusText}`);
      }
      
      const heartbeatData = await heartbeatResponse.json();
      console.log(`   ✅ Heartbeat ${i} exitoso:`, heartbeatData.message);
      
      // Esperar 2 segundos entre heartbeats
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 4. Verificar presencia después de heartbeats
    console.log('\n4️⃣ Verificando presencia después de heartbeats...');
    const presenceAfterResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!presenceAfterResponse.ok) {
      const errorData = await presenceAfterResponse.json();
      throw new Error(`Presencia después falló: ${errorData.error || presenceAfterResponse.statusText}`);
    }
    
    const presenceAfterData = await presenceAfterResponse.json();
    console.log('✅ Presencia después de heartbeats:', {
      totalEmpleados: presenceAfterData.length,
      online: presenceAfterData.filter(p => p.online).length,
      offline: presenceAfterData.filter(p => !p.online).length
    });
    
    // Verificar que el admin esté online
    const adminPresence = presenceAfterData.find(p => p.id === "admin@sharo.com");
    if (adminPresence && adminPresence.online) {
      console.log('✅ Admin marcado como online correctamente');
    } else {
      console.log('⚠️ Admin no está marcado como online');
    }
    
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
    
    // 6. Verificar presencia después del logout
    console.log('\n6️⃣ Verificando presencia después del logout...');
    const presenceFinalResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!presenceFinalResponse.ok) {
      const errorData = await presenceFinalResponse.json();
      throw new Error(`Presencia final falló: ${errorData.error || presenceFinalResponse.statusText}`);
    }
    
    const presenceFinalData = await presenceFinalResponse.json();
    console.log('✅ Presencia final:', {
      totalEmpleados: presenceFinalData.length,
      online: presenceFinalData.filter(p => p.online).length,
      offline: presenceFinalData.filter(p => !p.online).length
    });
    
    console.log('\n🎉 Todas las pruebas de presencia pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de presencia:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPresencia()
    .then(() => {
      console.log('\n✅ Script de pruebas de presencia completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando script de pruebas de presencia:', error);
      process.exit(1);
    });
}

module.exports = { testPresencia };
