const axios = require('axios');
const API_URL = 'http://localhost:3000';

async function testar() {
  try {
    console.log('🧪 TESTANDO API V2...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health OK');
    console.log('✅ TESTES PASSARAM!');
  } catch (err) {
    console.error('❌ ERRO:', err.message);
  }
}

testar();
