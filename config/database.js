const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.DB_PATH || './compras_ai.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ Erro BD:', err);
  else { console.log('✅ BD conectado'); inicializarBanco(); }
});

function inicializarBanco() {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    telefone TEXT, unidade TEXT NOT NULL, cargo TEXT, estado TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, err => err ? console.error('Erro usuarios:', err) : console.log('✅ usuarios OK'));

  db.run(`CREATE TABLE IF NOT EXISTS aquisicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL,
    modalidade TEXT NOT NULL, hipotese_dispensa TEXT, tipo_contratacao TEXT NOT NULL,
    descricao TEXT NOT NULL, quantidade TEXT, valor_estimado REAL, complexidade TEXT, prazo INTEGER,
    justificativa_modalidade TEXT, justificativa_necessidade TEXT, normas_aplicaveis TEXT,
    garantia_meses INTEGER, gera_etp TEXT, motivo_etp TEXT, gera_mapa_risco TEXT,
    motivo_mapa_risco TEXT, observacoes TEXT, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )`, err => err ? console.error('Erro aquisicoes:', err) : console.log('✅ aquisicoes OK'));

  db.run(`CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, aquisicao_id INTEGER NOT NULL,
    tipo_documento TEXT NOT NULL, arquivo_path TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aquisicao_id) REFERENCES aquisicoes(id)
  )`, err => err ? console.error('Erro docs:', err) : console.log('✅ documentos OK'));
}

module.exports = db;