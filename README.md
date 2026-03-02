# 🎯 Compras-AI

Sistema Inteligente de Aquisições Públicas para geração automática de documentos de licitação.

## 📋 Sobre o Projeto

O **Compras-AI** é uma aplicação web desenvolvida para auxiliar gestores públicos na elaboração de documentos necessários para processos de aquisição, baseando-se nas normas e leis brasileiras vigentes.

### Funcionalidades

- ✅ Cadastro de usuários e unidades
- ✅ Wizard interativo para coleta de informações
- ✅ Análise automática baseada em legislação (Lei 14.133/2021, IN SEGES 58/2022)
- ✅ Geração inteligente de documentos:
  - DFD (Documento de Formalização da Demanda)
  - TR (Termo de Referência)
  - ETP (Estudo Técnico Preliminar) - quando aplicável
  - Mapa de Risco - quando aplicável
- ✅ Determinação automática da necessidade de ETP e Mapa de Risco
- ✅ Histórico de aquisições

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js + Express
- **Banco de Dados:** SQLite
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Legislação Base:** Lei 14.133/2021, IN SEGES 58/2022

## 📦 Instalação

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/compras-ai.git
cd compras-ai
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor:
```bash
npm start
```

5. Acesse no navegador:
```
http://localhost:3000
```

## 🎮 Como Usar

1. **Cadastro:** Faça seu cadastro com dados da unidade
2. **Nova Aquisição:** Preencha o wizard em 5 etapas
3. **Análise Automática:** O sistema analisa e determina documentos necessários
4. **Geração:** Baixe os documentos gerados em formato editável

## 📚 Documentação da API

### Endpoints Principais

#### Usuários
- `POST /api/usuario` - Criar novo usuário
- `GET /api/usuario/:email` - Buscar usuário por email

#### Aquisições
- `POST /api/aquisicao` - Criar nova aquisição
- `GET /api/aquisicao/:id` - Buscar aquisição por ID
- `GET /api/usuario/:usuario_id/aquisicoes` - Listar aquisições do usuário

#### Health Check
- `GET /health` - Verificar status do servidor

## 🧪 Testes

Execute os testes automatizados:
```bash
npm test
```

## 📁 Estrutura do Projeto

```
compras-ai/
├── public/              # Arquivos estáticos (HTML, CSS, JS)
├── config/              # Configurações (banco de dados)
├── rules/               # Regras de negócio (ETP, Mapa de Risco)
├── models/              # Modelos de dados
├── templates/           # Templates de documentos
├── tests/               # Testes automatizados
├── server.js            # Servidor principal
├── package.json         # Dependências
└── README.md           # Este arquivo
```

## 📖 Legislação Base

- **Lei 14.133/2021** - Nova Lei de Licitações e Contratos
- **IN SEGES 58/2022** - Instrução Normativa sobre contratações públicas
- **Orientações TCU** - Tribunal de Contas da União

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

- Desenvolvedor Principal - [@seu-usuario](https://github.com/seu-usuario)

## 📞 Suporte

Para dúvidas e suporte, abra uma [issue](https://github.com/seu-usuario/compras-ai/issues).

---

Desenvolvido com ❤️ para facilitar as aquisições públicas no Brasil
