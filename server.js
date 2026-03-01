
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `
Você recebe uma descrição simples do que um servidor público precisa comprar.

Sua tarefa é:
- Interpretar a necessidade
- Classificar automaticamente
- Definir modalidade
- Decidir ETP e Mapa de Risco
- Gerar DFD
- Gerar Termo de Referência

Não faça perguntas.
Não peça dados.
Assuma cenários padrão administrativos quando faltar informação.

Sempre responda com:

1) ANÁLISE_JSON
2) DFD
3) TERMO_DE_REFERENCIA
`;

app.post('/api/chat', async (req, res) => {

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada.' });
  }

  const lastUser = [...req.body.messages].reverse().find(m => m.role === "user");
  const need = lastUser?.content || "Aquisição administrativa comum";

  try {

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
  model: "mistralai/mistral-7b-instruct",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: need }
  ],
  temperature: 0.2,
  max_tokens: 800
})
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";

    res.json({ text });

  } catch (err) {
    res.status(500).json({ error: "Erro interno" });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Compras.ai pronto');
});
