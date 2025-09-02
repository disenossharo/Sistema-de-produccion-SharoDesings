// Usar fetch nativo de Node.js

async function testSimpleRoutes() {
  console.log('🔍 PROBANDO RUTAS SIMPLES');
  console.log('==========================\n');

  const BACKEND_URL = 'https://sharo-backend-production.railway.app';
  
  try {
    // 1. Health Check
    console.log('1️⃣ Probando Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('Status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health Check:', healthData);
    } else {
      console.error('❌ Health Check fallido:', healthResponse.status);
    }

    // 2. Ruta de prueba simple
    console.log('\n2️⃣ Probando ruta /test...');
    const testResponse = await fetch(`${BACKEND_URL}/test`);
    console.log('Status:', testResponse.status);
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Ruta /test:', testData);
    } else {
      const errorText = await testResponse.text();
      console.error('❌ Error en /test:', errorText);
    }

    // 3. Ruta de prueba API
    console.log('\n3️⃣ Probando ruta /api/test...');
    const apiTestResponse = await fetch(`${BACKEND_URL}/api/test`);
    console.log('Status:', apiTestResponse.status);
    if (apiTestResponse.ok) {
      const apiTestData = await apiTestResponse.json();
      console.log('✅ Ruta /api/test:', apiTestData);
    } else {
      const errorText = await apiTestResponse.text();
      console.error('❌ Error en /api/test:', errorText);
    }

    // 4. Probar ruta inexistente para ver el manejo de errores
    console.log('\n4️⃣ Probando ruta inexistente...');
    const notFoundResponse = await fetch(`${BACKEND_URL}/ruta-inexistente`);
    console.log('Status:', notFoundResponse.status);
    if (notFoundResponse.ok) {
      const notFoundData = await notFoundResponse.json();
      console.log('✅ Ruta inexistente:', notFoundData);
    } else {
      const errorText = await notFoundResponse.text();
      console.error('❌ Error en ruta inexistente:', errorText);
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

testSimpleRoutes();
