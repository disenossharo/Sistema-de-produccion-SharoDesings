const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testHeartbeat() {
  try {
    console.log('🧪 Probando endpoint de heartbeat...');
    
    // Primero hacer login para obtener un token
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'empleado1@sharo.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Error en login:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Login exitoso, token obtenido');
    
    // Probar el endpoint de heartbeat
    const heartbeatResponse = await fetch(`${API_BASE}/produccion/heartbeat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!heartbeatResponse.ok) {
      const errorData = await heartbeatResponse.json();
      console.error('❌ Error en heartbeat:', errorData);
      return;
    }
    
    const heartbeatData = await heartbeatResponse.json();
    console.log('✅ Heartbeat exitoso:', heartbeatData);
    
    // Probar obtener presencia
    const presenciaResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!presenciaResponse.ok) {
      const errorData = await presenciaResponse.json();
      console.error('❌ Error obteniendo presencia:', errorData);
      return;
    }
    
    const presenciaData = await presenciaResponse.json();
    console.log('✅ Presencia obtenida:', presenciaData);
    
    // Probar obtener tareas activas
    const tareasResponse = await fetch(`${API_BASE}/produccion/activas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!tareasResponse.ok) {
      const errorData = await tareasResponse.json();
      console.error('❌ Error obteniendo tareas activas:', errorData);
      return;
    }
    
    const tareasData = await tareasResponse.json();
    console.log('✅ Tareas activas obtenidas:', tareasData);
    
    console.log('🎉 Todas las pruebas pasaron exitosamente');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testHeartbeat();
}
