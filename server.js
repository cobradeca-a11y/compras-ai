const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
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
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR);

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'compras-ai-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static('public'));
app.use('/documentos', express.static(DOCS_DIR));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mensagem: 'Servidor V2.1 Online ✅', timestamp: new Date().toISOString() });
});

// ===== AUTENTICAÇÃO =====

app.post('/api/registro', async (req, res) => {
  const { nome, email, senha, telefone, unidade, cargo, estado } = req.body;
  
  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = "INSERT INTO usuarios (nome, email, senha_hash, telefone, unidade, cargo, estado, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))";
    
    db.run(sql, [nome, email, senhaHash, telefone, unidade, cargo, estado], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        return res.status(500).json({ erro: 'Erro ao cadastrar' });
      }
      res.json({ sucesso: true, usuario_id: this.lastID, mensagem: 'Cadastro realizado!' });
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
    if (err) return res.status(500).json({ erro: 'Erro no servidor' });
    if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos' });
    
    try {
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaCorreta) return res.status(401).json({ erro: 'Email ou senha incorretos' });
      
      req.session.usuarioId = usuario.id;
      req.session.usuarioNome = usuario.nome;
      
      res.json({
        sucesso: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          unidade: usuario.unidade,
          cargo: usuario.cargo
        }
      });
    } catch (error) {
      res.status(500).json({ erro: 'Erro ao fazer login' });
    }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ sucesso: true });
});

app.get('/api/sessao', (req, res) => {
  if (!req.session.usuarioId) {
    return res.json({ autenticado: false });
  }
  
  db.get('SELECT id, nome, email, unidade, cargo FROM usuarios WHERE id = ?', [req.session.usuarioId], (err, usuario) => {
    if (err || !usuario) return res.json({ autenticado: false });
    res.json({ autenticado: true, usuario });
  });
});

// ===== AQUISIÇÕES =====

app.post('/api/aquisicao', async (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado' });
  
  const { modalidade, hipotese_dispensa, tipo_contratacao, descricao, quantidade, valor_estimado, complexidade, prazo, observacoes } = req.body;
  const usuario_id = req.session.usuarioId;

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

app.get('/api/minhas-aquisicoes', (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado' });
  
  db.all('SELECT * FROM aquisicoes WHERE usuario_id = ? ORDER BY criado_em DESC', [req.session.usuarioId], (err, aquisicoes) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ sucesso: true, total: aquisicoes.length, aquisicoes });
  });
});

app.get('/api/aquisicao/:id', (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado' });
  
  db.get('SELECT * FROM aquisicoes WHERE id = ? AND usuario_id = ?', [req.params.id, req.session.usuarioId], (err, aquisicao) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    if (!aquisicao) return res.status(404).json({ erro: 'Não encontrada' });
    res.json({ encontrado: true, aquisicao });
  });
});

app.post('/api/gerar-documentos/:aquisicao_id', async (req, res) => {
  if (!req.session.usuarioId) return res.status(401).json({ erro: 'Não autenticado' });

  try {
    const aquisicao = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM aquisicoes WHERE id = ? AND usuario_id = ?', [req.params.aquisicao_id, req.session.usuarioId], (err, row) => err ? reject(err) : resolve(row));
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
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao gerar documentos', detalhes: error.message });
  }
});

// ===== SPA FALLBACK =====
// Depois de todas as rotas, entregue o index.html para o frontend (React).
// Isso evita 404 em refresh e em URLs como /public/index.html.
app.get(/^\/(?!api\/|documentos\/|health$).*/, (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(404).send('index.html não encontrado em /public. Rode: npm run build');
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🎯 COMPRAS-AI V2.1 - ONLINE         ║
  ║   ✨ Com Login e Correções            ║
  ║   Porta: ${PORT}                            ║
  ║   URL: http://localhost:${PORT}            ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
