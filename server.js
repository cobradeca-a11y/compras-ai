const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const { decidirETP } = require('./rules/etpRules');
const { decidirMapaRisco } = require('./rules/mapaRiscoRules');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mensagem: 'Servidor rodando normalmente ✅',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// ROTAS DE USUÁRIO
// ==========================================

// Criar usuário
app.post('/api/usuario', (req, res) => {
  const { nome, email, telefone, unidade, cargo, estado } = req.body;

  const sql = `
    INSERT INTO usuarios (nome, email, telefone, unidade, cargo, estado, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [nome, email, telefone, unidade, cargo, estado], function(err) {
    if (err) {
      console.error('Erro ao criar usuário:', err);
      return res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: err.message });
    }

    res.json({
      sucesso: true,
      usuario_id: this.lastID,
      mensagem: 'Usuário cadastrado com sucesso!'
    });
  });
});

// Buscar usuário por email
app.get('/api/usuario/:email', (req, res) => {
  const { email } = req.params;

  const sql = 'SELECT * FROM usuarios WHERE email = ?';

  db.get(sql, [email], (err, usuario) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar usuário', detalhes: err.message });
    }

    if (!usuario) {
      return res.json({ encontrado: false });
    }

    res.json({ encontrado: true, usuario });
  });
});

// ==========================================
// ROTAS DE AQUISIÇÃO
// ==========================================

// Criar aquisição
app.post('/api/aquisicao', (req, res) => {
  const {
    usuario_id,
    modalidade,
    hipotese_dispensa,
    tipo_contratacao,
    descricao,
    quantidade,
    valor_estimado,
    complexidade,
    justificativa,
    normas,
    prazo
  } = req.body;

  // Aplicar regras de negócio
  const regraETP = decidirETP(modalidade, hipotese_dispensa, tipo_contratacao, complexidade);
  const regraMapaRisco = decidirMapaRisco(tipo_contratacao, valor_estimado, complexidade, prazo);

  const sql = `
    INSERT INTO aquisicoes (
      usuario_id, modalidade, hipotese_dispensa, tipo_contratacao, descricao,
      quantidade, valor_estimado, complexidade, justificativa, normas, prazo,
      gera_etp, motivo_etp, gera_mapa_risco, motivo_mapa_risco, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const params = [
    usuario_id, modalidade, hipotese_dispensa, tipo_contratacao, descricao,
    quantidade, valor_estimado, complexidade, justificativa, normas, prazo,
    regraETP.gera ? 'SIM' : 'NAO',
    regraETP.justificativa,
    regraMapaRisco.gera ? 'SIM' : 'NAO',
    regraMapaRisco.justificativa
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Erro ao criar aquisição:', err);
      return res.status(500).json({ erro: 'Erro ao criar aquisição', detalhes: err.message });
    }

    res.json({
      sucesso: true,
      aquisicao_id: this.lastID,
      regras: {
        etp: regraETP,
        mapa_risco: regraMapaRisco
      },
      mensagem: 'Aquisição criada com sucesso!'
    });
  });
});

// Buscar aquisição por ID
app.get('/api/aquisicao/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'SELECT * FROM aquisicoes WHERE id = ?';

  db.get(sql, [id], (err, aquisicao) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar aquisição', detalhes: err.message });
    }

    if (!aquisicao) {
      return res.status(404).json({ erro: 'Aquisição não encontrada' });
    }

    res.json({ encontrado: true, aquisicao });
  });
});

// Listar aquisições de um usuário
app.get('/api/usuario/:usuario_id/aquisicoes', (req, res) => {
  const { usuario_id } = req.params;

  const sql = 'SELECT * FROM aquisicoes WHERE usuario_id = ? ORDER BY criado_em DESC';

  db.all(sql, [usuario_id], (err, aquisicoes) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao listar aquisições', detalhes: err.message });
    }

    res.json({
      sucesso: true,
      total: aquisicoes.length,
      aquisicoes
    });
  });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║          🎯 COMPRAS-AI SERVIDOR              ║
  ║                                               ║
  ║  Status: ✅ Online                           ║
  ║  Porta: ${PORT}                                    ║
  ║  URL: http://localhost:${PORT}                   ║
  ║                                               ║
  ║  Acesse: http://localhost:${PORT}/index.html     ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
