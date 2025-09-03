const https = require('https');

console.log('🔍 PROBANDO TODOS LOS ENDPOINTS');
console.log('================================\n');

// URLs a probar
const baseUrl = 'https://sistema-de-produccion-sharodesings-production.up.railway.app';
const vercelUrl = 'https://sistema-de-produccion-sharo-hyn0y050a-sharodesings-projects.vercel.app';

const endpoints = [
  // Railway directo
  { name: 'Railway Health', url: `${baseUrl}/health` },
  { name: 'Railway Debug', url: `${baseUrl}/debug` },
  { name: 'Railway Test', url: `${baseUrl}/test` },
  { name: 'Railway API Test', url: `${baseUrl}/api/test` },
  
  // Vercel proxy
  { name: 'Vercel Health', url: `${vercelUrl}/api/health` },
  { name: 'Vercel Debug', url: `${vercelUrl}/api/debug` },
  { name: 'Vercel Test', url: `${vercelUrl}/api/test` },
  { name: 'Vercel Login', url: `${vercelUrl}/api/auth/login` }
];

async function testEndpoint(name, url) {
  return new Promise((resolve) => {
    console.log(`\n🌐 Probando: ${name}`);
    console.log(`   URL: ${url}`);
    
    const request = https.get(url, (response) => {
      console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`   Headers:`, {
        'content-type': response.headers['content-type'],
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'server': response.headers['server']
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
        resolve({ 
          name, 
          url, 
          status: response.statusCode, 
          data,
          success: response.statusCode >= 200 && response.statusCode < 300
        });
      });
    });
    
    request.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ name, url, status: 'ERROR', error: error.message, success: false });
    });
    
    request.setTimeout(10000, () => {
      console.log(`   ⏰ Timeout`);
      request.destroy();
      resolve({ name, url, status: 'TIMEOUT', success: false });
    });
  });
}

async function runTests() {
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Railway directo: Debería funcionar (200)');
  console.log('2. Vercel proxy: Debería redirigir a Railway (200)');
  console.log('3. Si ambos fallan: Problema de configuración\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push(result);
  }
  
  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log('==========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosos: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.name}: ${r.status}`);
  });
  
  console.log(`\n❌ Fallidos: ${failed.length}/${results.length}`);
  failed.forEach(r => {
    console.log(`   - ${r.name}: ${r.status}`);
  });
  
  console.log('\n🎯 CONCLUSIÓN:');
  if (successful.length === results.length) {
    console.log('🎉 ¡TODOS LOS ENDPOINTS FUNCIONAN!');
    console.log('✅ Railway: OK');
    console.log('✅ Vercel Proxy: OK');
    console.log('✅ Aplicación lista para usar');
  } else if (successful.length > 0) {
    console.log('⚠️  ALGUNOS ENDPOINTS FUNCIONAN');
    console.log('🔧 Revisar configuración de Vercel');
  } else {
    console.log('❌ NINGÚN ENDPOINT FUNCIONA');
    console.log('🔧 Revisar configuración de Railway');
  }
}

runTests().catch(console.error);
