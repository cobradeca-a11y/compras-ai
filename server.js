const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
Você é um assistente de compras públicas (Lei 14.133/2021), focado em DISPENSA ELETRÔNICA.

Objetivo:
- O usuário descreve, em texto livre, o que precisa comprar/contratar.
- Você NÃO faz perguntas.
- Você assume cenários padrão administrativos quando faltar informação.
- Você NÃO mostra "decisão automática", "ETP dispensável", "mapa de risco dispensável" etc. Isso é interno.
- Você entrega os documentos preenchidos e prontos para copiar/colar.

Saída OBRIGATÓRIA (sempre nesta ordem e com títulos):
1) ANALISE_JSON (apenas JSON válido)
2) DFD
3) TERMO_DE_REFERENCIA
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY não configurada." });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const lastUser = [...messages].reverse().find((m) => m?.role === "user");
    const need = (lastUser?.content || "").trim() || "Aquisição administrativa comum (dispensa eletrônica).";

    // Node 18+ já tem fetch nativo. (No Render normalmente é Node 18/20.)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // recomendados pelo OpenRouter (não obrigatórios, mas ajuda):
        "HTTP-Referer": process.env.APP_URL || "https://compras-ai.onrender.com",
        "X-Title": "compras.ai",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: need },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    // Se OpenRouter não devolver JSON/der erro, a gente devolve a causa (pra você enxergar no Render)
    const raw = await response.text();
    if (!response.ok) {
      return res.status(502).json({
        error: `OpenRouter falhou (${response.status})`,
        details: raw.slice(0, 800),
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "Resposta do OpenRouter não é JSON válido",
        details: raw.slice(0, 800),
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    return res.json({ text });
  } catch (err) {
    console.error("Erro /api/chat:", err);
    return res.status(500).json({ error: "Erro interno", details: String(err?.message || err) });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Compras.ai rodando na porta ${PORT}`));
