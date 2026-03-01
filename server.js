const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Você é um especialista em licitações e compras públicas brasileiras, com profundo conhecimento em:
- Lei 14.133/2021 (Nova Lei de Licitações e Contratos)
- IN SEGES/ME nº 65/2021 (padronização de contratações de TIC)
- IN nº 40/2020 (material de consumo)
- IN nº 67/2021 (serviços)
- Decreto 7.892/2013 (registro de preços)
- IN nº 5/2017 (serviços com dedicação exclusiva)
- Lei Complementar 123/2006 (ME/EPP)
- CATMAT e CATSER (SIASG)
- Limites de dispensa: até R$ 50.000 para bens/serviços comuns, até R$ 100.000 para obras

Sua função é analisar pedidos de compras de servidores públicos e:
1. Fazer PERGUNTAS ESTRATÉGICAS para coletar as informações necessárias (máx 3 perguntas por vez)
2. Classificar o objeto corretamente
3. Determinar a modalidade licitatória adequada
4. Indicar se exige ETP, Mapa de Risco, DFD
5. Sugerir o enquadramento CATMAT/CATSER
6. Indicar fundamentos legais específicos

REGRAS:
- Seja DIRETO e OBJETIVO. Linguagem simples, sem juridiquês desnecessário.
- Faça apenas UMA pergunta por vez.
- Nunca numere perguntas.
- Nunca use "Pergunta 1" ou "Pergunta 2".
- Escreva como um diálogo natural com o servidor público.
- Use frases curtas.
- Evite blocos longos de texto.
- A primeira interação deve ser acolhedora e curta.
- Comece entendendo o tipo de aquisição.
- Exemplo de tom:
  "Perfeito. Vamos começar entendendo melhor sua necessidade."
- Se o usuário disser apenas "bens de consumo" ou "material de consumo", NÃO assuma que é material de escritório. Primeiro pergunte qual item ou grupo de materiais deseja adquirir.
- Evite induzir a resposta do usuário com exemplos muito específicos, salvo se ele próprio já tiver informado o tipo de material.
- Após coletar dados suficientes (3-4 rodadas), gere o RELATÓRIO FINAL em JSON.

QUANDO TIVER DADOS SUFICIENTES, finalize OBRIGATORIAMENTE com:

ANÁLISE_JSON:
{
  "objeto": "descrição clara do objeto",
  "natureza": "material permanente | material de consumo | serviço comum | serviço não comum | obra | serviço de engenharia",
  "modalidade": "Dispensa de Licitação | Inexigibilidade | Pregão Eletrônico | Concorrência",
  "criterio_julgamento": "menor preço | melhor técnica | técnica e preço | maior desconto",
  "valor_estimado_faixa": "ex: até R$ 50.000 | entre R$ 50.000 e R$ 250.000 | acima de R$ 250.000",
  "exige_etp": true,
  "exige_mapa_risco": true,
  "exige_dfd": true,
  "exige_tr": true,
  "aplicar_exclusividade_me_epp": true,
  "aplicar_registro_precos": false,
  "catmat_catser_sugerido": "código e descrição sugerida",
  "fundamentos_legais": ["Art. X da Lei 14.133/2021"],
  "documentos_obrigatorios": [
    {"nome": "Documento Formal de Demanda (DFD)", "obrigatorio": true, "simplificado": false, "base_legal": "Art. 18 §1º Lei 14.133/2021"},
    {"nome": "Estudo Técnico Preliminar (ETP)", "obrigatorio": true, "simplificado": false, "base_legal": "Art. 18 Lei 14.133/2021"},
    {"nome": "Mapa de Risco", "obrigatorio": true, "simplificado": false, "base_legal": "Art. 18 §3º Lei 14.133/2021"},
    {"nome": "Termo de Referência", "obrigatorio": true, "simplificado": false, "base_legal": "Art. 6º XXIII Lei 14.133/2021"},
    {"nome": "Pesquisa de Preços", "obrigatorio": true, "simplificado": false, "base_legal": "IN 65/2021"}
  ],
  "alertas": ["alertas importantes, riscos, vedações"],
  "observacoes": "observações finais"
}`;

function normalizeMessages(messages) {
  // economiza tokens: manda só as últimas mensagens
  const last = Array.isArray(messages) ? messages.slice(-10) : [];

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
