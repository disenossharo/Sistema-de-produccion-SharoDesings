// Usar fetch nativo de Node.js

async function checkRailwayStatus() {
  console.log('🔍 VERIFICANDO ESTADO DE RAILWAY');
  console.log('=================================\n');

  const BACKEND_URL = 'https://sharo-backend-production.railway.app';
  
  try {
    // 1. Health Check con headers detallados
    console.log('1️⃣ Health Check con headers detallados...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    console.log('Status:', healthResponse.status);
    console.log('Headers:');
    for (const [key, value] of healthResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health Check Response:', healthData);
    }

    // 2. Probar con diferentes métodos HTTP
    console.log('\n2️⃣ Probando diferentes métodos HTTP...');
    
    // GET
    const getResponse = await fetch(`${BACKEND_URL}/test`, { method: 'GET' });
    console.log('GET /test:', getResponse.status);
    
    // POST
    const postResponse = await fetch(`${BACKEND_URL}/test`, { method: 'POST' });
    console.log('POST /test:', postResponse.status);
    
    // OPTIONS
    const optionsResponse = await fetch(`${BACKEND_URL}/test`, { method: 'OPTIONS' });
    console.log('OPTIONS /test:', optionsResponse.status);

    // 3. Probar con diferentes User-Agents
    console.log('\n3️⃣ Probando con diferentes User-Agents...');
    
    const userAgentResponse = await fetch(`${BACKEND_URL}/test`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Con User-Agent:', userAgentResponse.status);

    // 4. Verificar si hay redirecciones
    console.log('\n4️⃣ Verificando redirecciones...');
    const redirectResponse = await fetch(`${BACKEND_URL}/test`, { 
      redirect: 'manual' 
    });
    console.log('Redirect status:', redirectResponse.status);
    console.log('Location header:', redirectResponse.headers.get('location'));

  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
  }
}

checkRailwayStatus();
