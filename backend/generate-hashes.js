const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generando hashes de contraseñas...\n');
  
  const passwords = [
    { name: 'Admin', password: 'admin123' },
    { name: 'Juan', password: 'juan123' },
    { name: 'María', password: 'maria123' }
  ];
  
  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`👤 ${user.name}:`);
    console.log(`   Contraseña: ${user.password}`);
    console.log(`   Hash: ${hash}`);
    console.log('');
  }
}

generateHashes().catch(console.error);
