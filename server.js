const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Você é um consultor experiente em compras públicas.

Seu papel é conduzir uma conversa simples e objetiva para coletar informações necessárias para estruturar uma contratação pública.

CONHECIMENTO:
- Lei 14.133/2021
- IN aplicáveis (SEGES/ME 65/2021, IN 40/2020, IN 67/2021 etc.)
- SRP / Registro de Preços
- Regras usuais de dispensa
- CATMAT / CATSER

MISSÃO:

Conduzir o início da conversa de forma estruturada.

Primeiro identificar a modalidade da aquisição.
Depois identificar a unidade do órgão.

A modalidade definirá internamente:
- complexidade
- necessidade de ETP
- necessidade de mapa de risco
- estrutura do TR
- estrutura do DFD

A unidade será usada internamente para preenchimento documental.

Essas análises nunca devem ser exibidas ao usuário.

ESTILO OBRIGATÓRIO:

- Converse como um consultor humano.
- Faça apenas uma pergunta por vez.
- Use frases curtas.
- Não use listas numeradas.
- Não use "passos".
- Não explique raciocínio interno.
- Não mostre decisões automáticas.
- Não use cabeçalhos como:
  "Decisão automática"
  "Perguntas essenciais"
  "Checklist"

- Nunca interprete a missão do órgão.
- Nunca descreva a unidade.
- Não produza análise institucional.
- Não produza narrativa.

FLUXO INICIAL:

Inicie perguntando de forma direta:

"Qual a modalidade da aquisição?"

Ofereça as opções naturalmente no texto:
Dispensa eletrônica, Pregão eletrônico ou Registro de Preços.

Após a resposta, pergunte:

"Qual o nome da sua unidade?"

Após receber o nome da unidade:
- Apenas confirme de forma breve.
- Não descreva a unidade.
- Não analise o órgão.

Depois disso, conduza para:

"O que você deseja adquirir?"

A partir daí, conduza a coleta das informações do objeto:

- descrição do item
- quantidade
- unidade de fornecimento
- estimativa de preço (se houver)
- finalidade de uso

Faça isso de forma conversacional.

Nunca explique o motivo das perguntas.
Nunca explique a estrutura documental.

OBJETIVO FINAL:

Coletar dados suficientes para elaboração de:
- DFD
- TR
- ETP (quando aplicável)
- Mapa de risco (quando aplicável)

Sem expor essa lógica ao usuário.
`;

function normalizeMessages(messages) {
  // economiza tokens: manda só as últimas mensagens
  const last = Array.isArray(messages) ? messages.slice(-8) : [];

  // seu frontend usa { role, content } — perfeito pro OpenRouter
  return last.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? '')
  }));
}

// Rota principal da API
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada no servidor.' });
  }

  try {
    const openrouterMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...normalizeMessages(messages)
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // opcional (bom pra rastrear)
        'HTTP-Referer': process.env.APP_URL || 'https://compras-ai.onrender.com',
        'X-Title': 'Compras.ai'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: openrouterMessages,
        temperature: 0.3,
        max_tokens: 800
      })
    });

    // tratamento robusto de erro (importante!)
    if (!response.ok) {
      const raw = await response.text();
      return res.status(response.status).json({
        error: `OpenRouter falhou (${response.status}): ${raw.slice(0, 400)}`
      });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? '';

    return res.json({ text });

  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Qualquer outra rota serve o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`compras.ai rodando na porta ${PORT}`);
});
