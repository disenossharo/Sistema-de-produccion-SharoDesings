// Usar fetch nativo de Node.js

async function testDatabase() {
  console.log('🔍 PROBANDO CONEXIÓN A BASE DE DATOS');
  console.log('=====================================\n');

  const BACKEND_URL = 'https://sharo-backend-production.railway.app';
  
  try {
    // 1. Health Check
    console.log('1️⃣ Probando Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health Check:', healthData);
    } else {
      console.error('❌ Health Check fallido:', healthResponse.status);
    }

    // 2. Probar endpoint de empleados (sin autenticación)
    console.log('\n2️⃣ Probando endpoint de empleados...');
    const empleadosResponse = await fetch(`${BACKEND_URL}/api/empleados`);
    console.log('Status:', empleadosResponse.status);
    if (empleadosResponse.ok) {
      const empleadosData = await empleadosResponse.json();
      console.log('✅ Empleados obtenidos:', empleadosData.length, 'empleados');
    } else {
      const errorText = await empleadosResponse.text();
      console.error('❌ Error en empleados:', errorText);
    }

    // 3. Probar endpoint de producción
    console.log('\n3️⃣ Probando endpoint de producción...');
    const produccionResponse = await fetch(`${BACKEND_URL}/api/produccion`);
    console.log('Status:', produccionResponse.status);
    if (produccionResponse.ok) {
      const produccionData = await produccionResponse.json();
      console.log('✅ Producción obtenida:', produccionData.length, 'registros');
    } else {
      const errorText = await produccionResponse.text();
      console.error('❌ Error en producción:', errorText);
    }

    // 4. Probar endpoint de referencias
    console.log('\n4️⃣ Probando endpoint de referencias...');
    const referenciasResponse = await fetch(`${BACKEND_URL}/api/referencias`);
    console.log('Status:', referenciasResponse.status);
    if (referenciasResponse.ok) {
      const referenciasData = await referenciasResponse.json();
      console.log('✅ Referencias obtenidas:', referenciasData.length, 'referencias');
    } else {
      const errorText = await referenciasResponse.text();
      console.error('❌ Error en referencias:', errorText);
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

testDatabase();
