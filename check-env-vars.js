// Usar fetch nativo de Node.js

async function checkEnvVars() {
  console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO');
  console.log('====================================\n');

  const BACKEND_URL = 'https://sharo-backend-production.railway.app';
  
  try {
    // 1. Health Check
    console.log('1️⃣ Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health Check:', healthData);
    }

    // 2. Probar endpoint que debería mostrar variables de entorno
    console.log('\n2️⃣ Probando endpoint de debug...');
    const debugResponse = await fetch(`${BACKEND_URL}/debug`);
    console.log('Status:', debugResponse.status);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug info:', debugData);
    } else {
      const errorText = await debugResponse.text();
      console.log('❌ Debug endpoint:', errorText);
    }

    // 3. Verificar headers para ver si hay información de versión
    console.log('\n3️⃣ Verificando headers...');
    const headersResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('Headers relevantes:');
    console.log('- Server:', headersResponse.headers.get('server'));
    console.log('- X-Powered-By:', headersResponse.headers.get('x-powered-by'));
    console.log('- Date:', headersResponse.headers.get('date'));

  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

checkEnvVars();
