# 📘 INSTRUÇÕES DE INSTALAÇÃO E USO

## 🚀 Como Começar

### 1. Fazer Upload para o GitHub

1. Acesse https://github.com e faça login
2. Clique em "New repository"
3. Nome do repositório: `compras-ai`
4. Marque como **Public** ou **Private**
5. NÃO marque "Initialize with README" (já temos um)
6. Clique em "Create repository"

### 2. Fazer Upload dos Arquivos

Você pode fazer de duas formas:

#### Opção A: Upload Manual (Mais Fácil)
1. No seu repositório criado, clique em "uploading an existing file"
2. Arraste TODOS os arquivos desta pasta
3. Escreva uma mensagem: "Initial commit"
4. Clique em "Commit changes"

#### Opção B: Via Git (Recomendado)
```bash
# Navegue até a pasta do projeto
cd caminho/para/compras-ai

# Inicialize o git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - Compras-AI"

# Conecte ao repositório remoto (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/compras-ai.git

# Envie para o GitHub
git push -u origin main
```

### 3. Instalar Dependências

Após fazer upload, para usar o projeto localmente:

```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/compras-ai.git

# Entre na pasta
cd compras-ai

# Instale as dependências
npm install

# Copie o arquivo de exemplo de variáveis
cp .env.example .env

# Inicie o servidor
npm start
```

### 4. Acessar o Sistema

Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📂 Estrutura dos Arquivos

```
compras-ai/
├── .gitignore              # Arquivos ignorados pelo Git
├── .env.example            # Exemplo de variáveis de ambiente
├── package.json            # Dependências do projeto
├── README.md              # Documentação principal
├── INSTRUCOES.md          # Este arquivo
├── server.js              # Servidor principal
│
├── public/                # Interface web
│   ├── index.html         # Página principal
│   └── app.js            # JavaScript da interface
│
├── config/                # Configurações
│   └── database.js       # Configuração do banco
│
├── rules/                 # Regras de negócio
│   ├── etpRules.js       # Regras do ETP
│   └── mapaRiscoRules.js # Regras do Mapa de Risco
│
├── models/                # Modelos (vazio por enquanto)
├── templates/             # Templates (vazio por enquanto)
└── tests/                 # Testes
    └── testar-api.js     # Testes da API
```

## 🧪 Testando o Sistema

### Teste Automático da API
```bash
npm test
```

### Teste Manual
1. Inicie o servidor: `npm start`
2. Abra o navegador: `http://localhost:3000`
3. Preencha o formulário wizard
4. Veja a análise automática

## 🔧 Próximos Passos de Desenvolvimento

### Funcionalidades a Implementar:

1. **Geração de Documentos DOCX**
   - Instalar biblioteca: `npm install docx`
   - Criar templates em `templates/`
   - Implementar geração de DFD, TR, ETP, Mapa de Risco

2. **Sistema de Autenticação**
   - Login/logout de usuários
   - Sessões com JWT
   - Proteção de rotas

3. **Dashboard Completo**
   - Listagem de aquisições
   - Edição de aquisições
   - Download de documentos gerados

4. **Melhorias na Interface**
   - Validações em tempo real
   - Feedback visual melhorado
   - Modo escuro

## 📖 Referências

- [Lei 14.133/2021](http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm)
- [IN SEGES 58/2022](https://www.gov.br/compras/pt-br/acesso-a-informacao/legislacao/instrucoes-normativas/instrucao-normativa-seges-me-no-58-de-8-de-agosto-de-2022)

## ❓ Problemas Comuns

### Erro: "Cannot find module 'express'"
**Solução:** Execute `npm install`

### Erro: "Port 3000 already in use"
**Solução:** Altere a porta no arquivo `.env` ou mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [número_do_processo] /F

# Linux/Mac
lsof -i :3000
kill -9 [PID]
```

### Banco de dados não cria
**Solução:** Verifique permissões da pasta e delete o arquivo `.db` se existir

## 📞 Suporte

- **Issues:** https://github.com/SEU-USUARIO/compras-ai/issues
- **Email:** seu-email@exemplo.com

---

Bom desenvolvimento! 🚀
