const https = require('https');

console.log('🔍 VERIFICANDO REQUEST URL Y CONEXIÓN');
console.log('=====================================\n');

// URLs a probar
const urls = [
  'https://sharo-backend-production.railway.app/health',
  'https://sharo-backend-production.railway.app/debug',
  'https://sharo-backend-production.railway.app/api/auth/login',
  'https://sistema-de-produccion-sharo.vercel.app/api/auth/login'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n🌐 Probando: ${url}`);
    
    const request = https.get(url, (response) => {
      console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`   Headers:`, {
        'content-type': response.headers['content-type'],
        'access-control-allow-origin': response.headers['access-control-allow-origin']
      });
      
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        if (data) {
          try {
            const json = JSON.parse(data);
            console.log(`   Response:`, json);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
        }
        resolve({ status: response.statusCode, data });
      });
    });
    
    request.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ status: 'ERROR', error: error.message });
    });
    
    request.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout`);
      request.destroy();
      resolve({ status: 'TIMEOUT' });
    });
  });
}

async function runTests() {
  console.log('📋 INSTRUCCIONES PARA VERIFICAR REQUEST URL:');
  console.log('1. Abre tu aplicación en el navegador');
  console.log('2. Presiona F12 (Herramientas de desarrollador)');
  console.log('3. Ve a la pestaña "Network" (Red)');
  console.log('4. Intenta hacer login');
  console.log('5. Busca la petición que falla');
  console.log('6. Verifica el "Request URL" en la pestaña Headers\n');
  
  console.log('🔍 PROBANDO CONEXIONES DIRECTAS:');
  
  for (const url of urls) {
    await testUrl(url);
  }
  
  console.log('\n📊 RESUMEN:');
  console.log('- Si Railway responde 200: Backend funciona');
  console.log('- Si Vercel responde 200: Proxy funciona');
  console.log('- Si ambos fallan: Problema de configuración');
}

runTests().catch(console.error);
