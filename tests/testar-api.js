const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testar() {
  try {
    console.log('\n🧪 TESTANDO ROTAS DA API...\n');

    // 1. Health check
    console.log('✅ Teste 1: GET /health');
    const health = await axios.get(`${API_URL}/health`);
    console.log('Resposta:', health.data);
    console.log('');

    // 2. Criar usuário
    console.log('✅ Teste 2: POST /api/usuario');
    const usuarioRes = await axios.post(`${API_URL}/api/usuario`, {
      nome: 'João Silva',
      email: 'joao@example.com',
      telefone: '11987654321',
      unidade: 'Secretaria de Educação',
      cargo: 'Gestor de Compras',
      estado: 'SP'
    });
    console.log('Resposta:', usuarioRes.data);
    const usuario_id = usuarioRes.data.usuario_id;
    console.log('');

    // 3. Buscar usuário
    console.log('✅ Teste 3: GET /api/usuario/:email');
    const usuarioBusca = await axios.get(`${API_URL}/api/usuario/joao@example.com`);
    console.log('Resposta:', usuarioBusca.data);
    console.log('');

    // 4. Criar aquisição simples
    console.log('✅ Teste 4: POST /api/aquisicao (SIMPLES)');
    const aquisicao1 = await axios.post(`${API_URL}/api/aquisicao`, {
      usuario_id: usuario_id,
      modalidade: 'dispensa',
      hipotese_dispensa: 'dispensa_por_valor',
      tipo_contratacao: 'produto',
      descricao: 'Aquisição de materiais de escritório',
      quantidade: '100 unidades',
      valor_estimado: 5000.00,
      complexidade: 'baixa',
      justificativa: 'Necessidade de reposição de estoque',
      normas: 'ABNT',
      prazo: null
    });
    console.log('Resposta:', aquisicao1.data);
    console.log('');

    // 5. Criar aquisição complexa
    console.log('✅ Teste 5: POST /api/aquisicao (COMPLEXA)');
    const aquisicao2 = await axios.post(`${API_URL}/api/aquisicao`, {
      usuario_id: usuario_id,
      modalidade: 'pregao',
      hipotese_dispensa: null,
      tipo_contratacao: 'engenharia',
      descricao: 'Reforma completa do prédio administrativo',
      quantidade: '1000m²',
      valor_estimado: 500000.00,
      complexidade: 'alta',
      justificativa: 'Modernização das instalações',
      normas: 'NBR específicas de construção',
      prazo: 180
    });
    console.log('Resposta:', aquisicao2.data);
    console.log('');

    // 6. Listar aquisições
    console.log('✅ Teste 6: GET /api/usuario/:usuario_id/aquisicoes');
    const aquisicoes = await axios.get(`${API_URL}/api/usuario/${usuario_id}/aquisicoes`);
    console.log('Resposta:', aquisicoes.data);
    console.log('');

    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!\n');

  } catch (err) {
    console.error('❌ ERRO:', err.response?.data || err.message);
  }
}

testar();
