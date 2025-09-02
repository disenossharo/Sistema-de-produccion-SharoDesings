// Usar fetch nativo de Node.js

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA');
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

    // 2. Verificar headers CORS
    console.log('\n2️⃣ Verificando headers CORS...');
    const corsResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://sistema-de-produccion-sharo.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Status:', corsResponse.status);
    console.log('Headers CORS:');
    console.log('- Access-Control-Allow-Origin:', corsResponse.headers.get('access-control-allow-origin'));
    console.log('- Access-Control-Allow-Methods:', corsResponse.headers.get('access-control-allow-methods'));
    console.log('- Access-Control-Allow-Headers:', corsResponse.headers.get('access-control-allow-headers'));

    // 3. Probar login
    console.log('\n3️⃣ Probando login...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sistema-de-produccion-sharo.vercel.app'
      },
      body: JSON.stringify({
        email: 'admin@sharo.com',
        password: 'admin123'
      })
    });

    console.log('Status:', loginResponse.status);
    console.log('Headers de respuesta:');
    console.log('- Access-Control-Allow-Origin:', loginResponse.headers.get('access-control-allow-origin'));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.error('❌ Error en login:', errorText);
    }

    // 4. Probar endpoint de empleados
    console.log('\n4️⃣ Probando endpoint de empleados...');
    const empleadosResponse = await fetch(`${BACKEND_URL}/api/empleados`, {
      headers: {
        'Origin': 'https://sistema-de-produccion-sharo.vercel.app'
      }
    });
    
    console.log('Status:', empleadosResponse.status);
    if (empleadosResponse.ok) {
      const empleadosData = await empleadosResponse.json();
      console.log('✅ Empleados obtenidos:', empleadosData.length, 'empleados');
    } else {
      const errorText = await empleadosResponse.text();
      console.error('❌ Error en empleados:', errorText);
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

diagnosticoCompleto();
