const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./config/database');
const { decidirETP } = require('./rules/etpRules');
const { decidirMapaRisco } = require('./rules/mapaRiscoRules');
const { analisarObjeto } = require('./rules/analiseInteligente');
const { gerarDFD } = require('./templates/dfd');
const { gerarTR } = require('./templates/tr');
const { gerarETP } = require('./templates/etp');
const { gerarMapaRisco } = require('./templates/mapaRisco');

const app = express();
const PORT = process.env.PORT || 3000;

const DOCS_DIR = path.join(__dirname, 'documentos_gerados');
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/documentos', express.static(DOCS_DIR));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Servidor V2 rodando ✅', timestamp: new Date().toISOString() });
});

app.post('/api/usuario', (req, res) => {
  const { nome, email, telefone, unidade, cargo, estado } = req.body;
  const sql = "INSERT INTO usuarios (nome, email, telefone, unidade, cargo, estado, criado_em) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))";
  
  db.run(sql, [nome, email, telefone, unidade, cargo, estado], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao criar usuário', detalhes: err.message });
    res.json({ sucesso: true, usuario_id: this.lastID, mensagem: 'Usuário cadastrado!' });
  });
});

app.get('/api/usuario/:email', (req, res) => {
  const sql = 'SELECT * FROM usuarios WHERE email = ?';
  db.get(sql, [req.params.email], (err, usuario) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    res.json({ encontrado: !!usuario, usuario });
  });
});

app.post('/api/aquisicao', async (req, res) => {
  const { usuario_id, modalidade, hipotese_dispensa, tipo_contratacao, descricao, quantidade, valor_estimado, complexidade, prazo, observacoes } = req.body;

  try {
    const analise = analisarObjeto(descricao, tipo_contratacao, valor_estimado);
    const regraETP = decidirETP(modalidade, hipotese_dispensa, tipo_contratacao, complexidade);
    const regraMapaRisco = decidirMapaRisco(tipo_contratacao, valor_estimado, complexidade, prazo);

    const sql = `INSERT INTO aquisicoes (usuario_id, modalidade, hipotese_dispensa, tipo_contratacao, descricao, quantidade, valor_estimado, complexidade, prazo, justificativa_modalidade, justificativa_necessidade, normas_aplicaveis, garantia_meses, gera_etp, motivo_etp, gera_mapa_risco, motivo_mapa_risco, observacoes, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;

    const params = [usuario_id, modalidade, hipotese_dispensa, tipo_contratacao, descricao, quantidade, valor_estimado, complexidade, prazo, analise.justificativa_modalidade, analise.justificativa_necessidade, analise.normas_aplicaveis, analise.garantia_meses, regraETP.gera ? 'SIM' : 'NAO', regraETP.justificativa, regraMapaRisco.gera ? 'SIM' : 'NAO', regraMapaRisco.justificativa, observacoes];

    db.run(sql, params, function(err) {
      if (err) return res.status(500).json({ erro: 'Erro ao criar aquisição' });
      res.json({ sucesso: true, aquisicao_id: this.lastID, analise, regras: { etp: regraETP, mapa_risco: regraMapaRisco } });
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao processar' });
  }
});

app.get('/api/aquisicao/:id', (req, res) => {
  db.get('SELECT * FROM aquisicoes WHERE id = ?', [req.params.id], (err, aquisicao) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    if (!aquisicao) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ encontrado: true, aquisicao });
  });
});

app.get('/api/usuario/:usuario_id/aquisicoes', (req, res) => {
  db.all('SELECT * FROM aquisicoes WHERE usuario_id = ? ORDER BY criado_em DESC', [req.params.usuario_id], (err, aquisicoes) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ sucesso: true, total: aquisicoes.length, aquisicoes });
  });
});

app.post('/api/gerar-documentos/:aquisicao_id', async (req, res) => {
  try {
    const aquisicao = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM aquisicoes WHERE id = ?', [req.params.aquisicao_id], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!aquisicao) return res.status(404).json({ erro: 'Aquisição não encontrada' });

    const usuario = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM usuarios WHERE id = ?', [aquisicao.usuario_id], (err, row) => err ? reject(err) : resolve(row));
    });

    const documentos = [];
    
    const dfdPath = await gerarDFD(aquisicao, usuario, DOCS_DIR);
    documentos.push({ tipo: 'DFD', nome: path.basename(dfdPath), url: `/documentos/${path.basename(dfdPath)}` });

    const trPath = await gerarTR(aquisicao, usuario, DOCS_DIR);
    documentos.push({ tipo: 'TR', nome: path.basename(trPath), url: `/documentos/${path.basename(trPath)}` });

    if (aquisicao.gera_etp === 'SIM') {
      const etpPath = await gerarETP(aquisicao, usuario, DOCS_DIR);
      documentos.push({ tipo: 'ETP', nome: path.basename(etpPath), url: `/documentos/${path.basename(etpPath)}` });
    }

    if (aquisicao.gera_mapa_risco === 'SIM') {
      const mapaPath = await gerarMapaRisco(aquisicao, usuario, DOCS_DIR);
      documentos.push({ tipo: 'MAPA_RISCO', nome: path.basename(mapaPath), url: `/documentos/${path.basename(mapaPath)}` });
    }

    for (const doc of documentos) {
      await new Promise((resolve, reject) => {
        db.run("INSERT INTO documentos (aquisicao_id, tipo_documento, arquivo_path, criado_em) VALUES (?, ?, ?, datetime('now'))", [req.params.aquisicao_id, doc.tipo, doc.nome], err => err ? reject(err) : resolve());
      });
    }

    res.json({ sucesso: true, mensagem: 'Documentos gerados!', documentos });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao gerar documentos', detalhes: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🎯 COMPRAS-AI V2 - SERVIDOR ONLINE  ║
  ║   Porta: ${PORT}                            ║
  ║   URL: http://localhost:${PORT}            ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;