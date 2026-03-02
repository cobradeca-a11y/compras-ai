const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const DB_PATH = process.env.DB_PATH || './compras_ai.db';

// Criar conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com banco de dados:', err);
  } else {
    console.log('✅ Conectado ao banco de dados SQLite');
    inicializarBanco();
  }
});

// Função para inicializar as tabelas
function inicializarBanco() {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefone TEXT,
      unidade TEXT NOT NULL,
      cargo TEXT,
      estado TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erro ao criar tabela usuarios:', err);
    else console.log('✅ Tabela usuarios OK');
  });

  // Tabela de aquisições
  db.run(`
    CREATE TABLE IF NOT EXISTS aquisicoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      modalidade TEXT NOT NULL,
      hipotese_dispensa TEXT,
      tipo_contratacao TEXT NOT NULL,
      descricao TEXT NOT NULL,
      quantidade TEXT,
      valor_estimado REAL,
      complexidade TEXT,
      justificativa TEXT,
      normas TEXT,
      prazo INTEGER,
      gera_etp TEXT,
      motivo_etp TEXT,
      gera_mapa_risco TEXT,
      motivo_mapa_risco TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `, (err) => {
    if (err) console.error('Erro ao criar tabela aquisicoes:', err);
    else console.log('✅ Tabela aquisicoes OK');
  });

  // Tabela de documentos gerados
  db.run(`
    CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      aquisicao_id INTEGER NOT NULL,
      tipo_documento TEXT NOT NULL,
      conteudo TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (aquisicao_id) REFERENCES aquisicoes(id)
    )
  `, (err) => {
    if (err) console.error('Erro ao criar tabela documentos:', err);
    else console.log('✅ Tabela documentos OK');
  });
}

module.exports = db;
