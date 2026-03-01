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
- Faça apenas 2-3 perguntas por vez.
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

// Rota principal da API
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  try {
    // Converte o histórico para o formato do Gemini
    const geminiContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiContents,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.3 }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });

  } catch (err) {
    console.error('Erro na API:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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
