const fetch = require('node-fetch');

const API_BASE = "http://localhost:3001/api";

/**
 * Script de prueba para verificar el dashboard del admin
 * Este script prueba la obtención de empleados, tareas activas y presencia
 */

async function testAdminDashboard() {
  console.log('🧪 Iniciando pruebas del dashboard del admin...\n');
  
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
    
    // 2. Verificar empleados
    console.log('\n2️⃣ Verificando empleados...');
    const empleadosResponse = await fetch(`${API_BASE}/empleados`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!empleadosResponse.ok) {
      const errorData = await empleadosResponse.json();
      throw new Error(`Empleados falló: ${errorData.error || empleadosResponse.statusText}`);
    }
    
    const empleadosData = await empleadosResponse.json();
    console.log('✅ Empleados obtenidos:', {
      total: empleadosData.length,
      empleados: empleadosData.map(emp => ({ id: emp.id, nombre: emp.nombre }))
    });
    
    // 3. Verificar tareas activas
    console.log('\n3️⃣ Verificando tareas activas...');
    const tareasActivasResponse = await fetch(`${API_BASE}/produccion/tareas-activas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!tareasActivasResponse.ok) {
      const errorData = await tareasActivasResponse.json();
      throw new Error(`Tareas activas falló: ${errorData.error || tareasActivasResponse.statusText}`);
    }
    
    const tareasActivasData = await tareasActivasResponse.json();
    console.log('✅ Tareas activas obtenidas:', {
      total: tareasActivasData.length,
      tareas: tareasActivasData.map(t => ({ 
        id: t.id, 
        usuario: t.usuario, 
        estado: t.estado,
        horaInicio: t.horaInicio 
      }))
    });
    
    // 4. Verificar presencia
    console.log('\n4️⃣ Verificando presencia...');
    const presenciaResponse = await fetch(`${API_BASE}/produccion/presencia`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!presenciaResponse.ok) {
      const errorData = await presenciaResponse.json();
      throw new Error(`Presencia falló: ${errorData.error || presenciaResponse.statusText}`);
    }
    
    const presenciaData = await presenciaResponse.json();
    console.log('✅ Presencia obtenida:', {
      total: presenciaData.length,
      online: presenciaData.filter(p => p.online).length,
      offline: presenciaData.filter(p => !p.online).length,
      detalles: presenciaData.map(p => ({ 
        id: p.id, 
        nombre: p.nombre, 
        online: p.online, 
        lastSeen: p.lastSeen 
      }))
    });
    
    // 5. Verificar estadísticas
    console.log('\n5️⃣ Verificando estadísticas...');
    const estadisticasResponse = await fetch(`${API_BASE}/produccion/estadisticas`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!estadisticasResponse.ok) {
      const errorData = await estadisticasResponse.json();
      throw new Error(`Estadísticas falló: ${errorData.error || estadisticasResponse.statusText}`);
    }
    
    const estadisticasData = await estadisticasResponse.json();
    console.log('✅ Estadísticas obtenidas:', estadisticasData);
    
    // 6. Verificar tareas del día para un empleado específico
    if (empleadosData.length > 0) {
      const primerEmpleado = empleadosData[0];
      console.log(`\n6️⃣ Verificando tareas del día para ${primerEmpleado.nombre}...`);
      
      const tareasDelDiaResponse = await fetch(`${API_BASE}/produccion/tareas-del-dia/${primerEmpleado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!tareasDelDiaResponse.ok) {
        const errorData = await tareasDelDiaResponse.json();
        console.log('⚠️ Tareas del día falló:', errorData.error || tareasDelDiaResponse.statusText);
      } else {
        const tareasDelDiaData = await tareasDelDiaResponse.json();
        console.log('✅ Tareas del día obtenidas:', {
          empleado: primerEmpleado.nombre,
          total: tareasDelDiaData.length,
          tareas: tareasDelDiaData.map(t => ({ 
            id: t.id, 
            estado: t.estado, 
            efectividad: t.efectividad 
          }))
        });
      }
    }
    
    // 7. Probar heartbeat
    console.log('\n7️⃣ Probando heartbeat...');
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
    
    console.log('\n🎉 Todas las pruebas del dashboard del admin pasaron exitosamente!');
    
    // Resumen final
    console.log('\n📊 RESUMEN DEL DASHBOARD:');
    console.log(`   👥 Empleados totales: ${empleadosData.length}`);
    console.log(`   🔴 Tareas activas: ${tareasActivasData.length}`);
    console.log(`   🟢 Empleados online: ${presenciaData.filter(p => p.online).length}`);
    console.log(`   📈 Tareas completadas hoy: ${estadisticasData.tareasCompletadasHoy || 0}`);
    
  } catch (error) {
    console.error('❌ Error en las pruebas del dashboard:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAdminDashboard()
    .then(() => {
      console.log('\n✅ Script de pruebas del dashboard completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando script de pruebas del dashboard:', error);
      process.exit(1);
    });
}

module.exports = { testAdminDashboard };
