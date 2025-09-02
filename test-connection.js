// Usar fetch nativo de Node.js

async function testConnection() {
  console.log('🧪 Probando conexión al backend...');
  
  try {
    // Probar health check
    console.log('1️⃣ Probando health check...');
    const healthResponse = await fetch('https://sharo-backend-production.railway.app/health');
    const healthData = await healthResponse.text();
    console.log('✅ Health check:', healthData);
    
    // Probar login
    console.log('2️⃣ Probando login...');
    const loginResponse = await fetch('https://sharo-backend-production.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sharo.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
