import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

function money(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Toast({ kind, children }) {
  if (!children) return null;
  return <div className={`toast ${kind}`}>{children}</div>;
}

function KV({ k, v }) {
  return (
    <div className="kv">
      <b>{k}</b>
      <span>{v ?? ''}</span>
    </div>
  );
}

export default function App() {
  const [sessao, setSessao] = useState({ loading: true, autenticado: false, usuario: null });
  const [health, setHealth] = useState('');

  // auth
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [authMsg, setAuthMsg] = useState(null);
  const [authKind, setAuthKind] = useState('ok');

  const [reg, setReg] = useState({
    nome: '', telefone: '', email: '', senha: '', unidade: '', cargo: '', estado: ''
  });
  const [regMsg, setRegMsg] = useState(null);
  const [regKind, setRegKind] = useState('ok');

  // aquisições
  const [aForm, setAForm] = useState({
    modalidade: 'DISPENSA',
    hipotese_dispensa: '',
    tipo_contratacao: 'PONTUAL',
    complexidade: 'BAIXA',
    descricao: '',
    quantidade: '',
    valor_estimado: '',
    prazo: '',
    observacoes: ''
  });
  const [appMsg, setAppMsg] = useState(null);
  const [appKind, setAppKind] = useState('ok');

  const [analise, setAnalise] = useState(null);
  const [aquisicoes, setAquisicoes] = useState([]);
  const [aquisicaoSel, setAquisicaoSel] = useState(null);
  const [docs, setDocs] = useState(null);
  const [gerandoDocs, setGerandoDocs] = useState(false);

  const sessaoPill = useMemo(() => {
    if (sessao.loading) return 'Verificando sessão…';
    if (!sessao.autenticado) return `Não autenticado${health ? ` • ${health}` : ''}`;
    return `Logado: ${sessao.usuario?.nome || 'Usuário'} (${sessao.usuario?.email || ''})${health ? ` • ${health}` : ''}`;
  }, [sessao, health]);

  async function carregarHealth() {
    try {
      const h = await api('/health', { method: 'GET', headers: {} });
      if (h?.mensagem) setHealth(h.mensagem);
    } catch {
      // ignore
    }
  }

  async function checkSessao(silent = true) {
    try {
      const s = await api('/api/sessao', { method: 'GET' });
      if (s.autenticado) {
        setSessao({ loading: false, autenticado: true, usuario: s.usuario });
        if (!silent) {
          setAuthKind('ok');
          setAuthMsg('Sessão ativa ✅');
        }
        await carregarAquisicoes();
        return;
      }
      setSessao({ loading: false, autenticado: false, usuario: null });
      if (!silent) {
        setAuthKind('warn');
        setAuthMsg('Você não está logado.');
      }
    } catch (e) {
      setSessao({ loading: false, autenticado: false, usuario: null });
      if (!silent) {
        setAuthKind('bad');
        setAuthMsg('Falha ao verificar sessão: ' + e.message);
      }
    }
  }

  useEffect(() => {
    (async () => {
      await carregarHealth();
      await checkSessao(true);
    })();
  }, []);

  async function login() {
    setAuthMsg(null);
    if (!loginEmail || !loginSenha) {
      setAuthKind('warn');
      setAuthMsg('Informe email e senha.');
      return;
    }

    try {
      const r = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, senha: loginSenha })
      });
      setSessao({ loading: false, autenticado: true, usuario: r.usuario });
      setAuthKind('ok');
      setAuthMsg('Login OK ✅');
      await carregarAquisicoes();
    } catch (e) {
      setAuthKind('bad');
      setAuthMsg(e.message);
    }
  }

  async function registro() {
    setRegMsg(null);
    const { nome, email, senha, unidade } = reg;
    if (!nome || !email || !senha || !unidade) {
      setRegKind('warn');
      setRegMsg('Preencha pelo menos: Nome, Email, Senha e Unidade.');
      return;
    }
    try {
      await api('/api/registro', { method: 'POST', body: JSON.stringify(reg) });
      setRegKind('ok');
      setRegMsg('Cadastro realizado ✅ Agora faça login.');
    } catch (e) {
      setRegKind('bad');
      setRegMsg(e.message);
    }
  }

  async function logout() {
    try {
      await api('/api/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // ignore
    }
    setSessao({ loading: false, autenticado: false, usuario: null });
    setAquisicoes([]);
    setAquisicaoSel(null);
    setDocs(null);
    setAnalise(null);
  }

  async function carregarAquisicoes() {
    try {
      const r = await api('/api/minhas-aquisicoes', { method: 'GET' });
      setAquisicoes(r.aquisicoes || []);
    } catch {
      setAquisicoes([]);
    }
  }

  async function criarAquisicao() {
    setAppMsg(null);
    if (!aForm.descricao?.trim()) {
      setAppKind('warn');
      setAppMsg('Descreva o objeto da aquisição.');
      return;
    }
    try {
      const payload = {
        ...aForm,
        valor_estimado: aForm.valor_estimado === '' ? null : Number(aForm.valor_estimado),
        prazo: aForm.prazo === '' ? null : Number(aForm.prazo)
      };
      const r = await api('/api/aquisicao', { method: 'POST', body: JSON.stringify(payload) });
      setAppKind('ok');
      setAppMsg(`Aquisição criada ✅ ID: ${r.aquisicao_id}`);
      setAnalise({ analise: r.analise, regras: r.regras });
      await carregarAquisicoes();
      await selecionarAquisicao(r.aquisicao_id);
    } catch (e) {
      setAppKind('bad');
      setAppMsg(e.message);
    }
  }

  async function selecionarAquisicao(id) {
    setDocs(null);
    try {
      const r = await api(`/api/aquisicao/${id}`, { method: 'GET' });
      setAquisicaoSel(r.aquisicao);
    } catch (e) {
      setAquisicaoSel(null);
      setAppKind('bad');
      setAppMsg(e.message);
    }
  }

  async function gerarDocumentos() {
    if (!aquisicaoSel?.id) return;
    setGerandoDocs(true);
    setDocs(null);
    try {
      const r = await api(`/api/gerar-documentos/${aquisicaoSel.id}`, { method: 'POST', body: JSON.stringify({}) });
      setDocs(r.documentos || []);
    } catch (e) {
      setAppKind('bad');
      setAppMsg(e.message);
    } finally {
      setGerandoDocs(false);
    }
  }

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          <div>
            <h1>Compras AI <span className="pill">v2.1</span></h1>
            <small>Login + histórico por usuário + DOCX</small>
          </div>
        </div>

        <div className="top-actions">
          <span className="pill">{sessaoPill}</span>
          {sessao.autenticado && (
            <button className="btn danger" onClick={logout}>Sair</button>
          )}
        </div>
      </header>

      {!sessao.autenticado ? (
        <section className="grid">
          <div className="card">
            <h2>Entrar</h2>
            <div className="hint">Use seu email e senha. O login cria uma sessão (cookie) no servidor.</div>

            <label>Email</label>
            <input value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} type="email" placeholder="ex: seuemail@org.br" autoComplete="email" />

            <label>Senha</label>
            <input value={loginSenha} onChange={(e)=>setLoginSenha(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />

            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button className="btn primary" onClick={login}>Entrar</button>
              <button className="btn ghost" onClick={()=>checkSessao(false)}>Recarregar sessão</button>
            </div>

            <Toast kind={authKind}>{authMsg}</Toast>
          </div>

          <div className="card">
            <h2>Cadastrar</h2>
            <div className="hint">Cadastro cria o usuário no SQLite e permite login em seguida.</div>

            <div className="row two">
              <div>
                <label>Nome</label>
                <input value={reg.nome} onChange={(e)=>setReg(r=>({...r, nome:e.target.value}))} placeholder="Nome completo" />
              </div>
              <div>
                <label>Telefone</label>
                <input value={reg.telefone} onChange={(e)=>setReg(r=>({...r, telefone:e.target.value}))} placeholder="(xx) xxxxx-xxxx" />
              </div>
            </div>

            <label>Email</label>
            <input value={reg.email} onChange={(e)=>setReg(r=>({...r, email:e.target.value}))} type="email" placeholder="ex: seuemail@org.br" />

            <label>Senha</label>
            <input value={reg.senha} onChange={(e)=>setReg(r=>({...r, senha:e.target.value}))} type="password" placeholder="Crie uma senha" />

            <div className="row two">
              <div>
                <label>Unidade/Órgão</label>
                <input value={reg.unidade} onChange={(e)=>setReg(r=>({...r, unidade:e.target.value}))} placeholder="Ex: Estação Radiogoniométrica" />
              </div>
              <div>
                <label>Cargo/Função</label>
                <input value={reg.cargo} onChange={(e)=>setReg(r=>({...r, cargo:e.target.value}))} placeholder="Ex: Agente" />
              </div>
            </div>

            <label>Estado (UF)</label>
            <input value={reg.estado} onChange={(e)=>setReg(r=>({...r, estado:e.target.value.toUpperCase()}))} placeholder="Ex: RS" maxLength={2} />

            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <button className="btn primary" onClick={registro}>Cadastrar</button>
            </div>

            <Toast kind={regKind}>{regMsg}</Toast>
          </div>
        </section>
      ) : (
        <section>
          <div className="grid three" style={{ marginTop: 10 }}>
            <div className="card">
              <h2>Nova aquisição</h2>
              <div className="hint">
                Preencha o básico. O backend decide automaticamente ETP e Mapa de Risco pelas regras do sistema.
              </div>

              <div className="row two">
                <div>
                  <label>Modalidade</label>
                  <select value={aForm.modalidade} onChange={(e)=>setAForm(f=>({...f, modalidade:e.target.value}))}>
                    <option value="DISPENSA">DISPENSA</option>
                    <option value="INEXIGIBILIDADE">INEXIGIBILIDADE</option>
                    <option value="PREGAO">PREGÃO</option>
                    <option value="CONCORRENCIA">CONCORRÊNCIA</option>
                    <option value="OUTRA">OUTRA</option>
                  </select>
                </div>
                <div>
                  <label>Hipótese (se dispensa/inexig.)</label>
                  <input value={aForm.hipotese_dispensa} onChange={(e)=>setAForm(f=>({...f, hipotese_dispensa:e.target.value}))} placeholder="Ex: Art. 75, II (se aplicável)" />
                </div>
              </div>

              <div className="row two">
                <div>
                  <label>Tipo de contratação</label>
                  <select value={aForm.tipo_contratacao} onChange={(e)=>setAForm(f=>({...f, tipo_contratacao:e.target.value}))}>
                    <option value="PONTUAL">PONTUAL</option>
                    <option value="CONTINUADA">CONTINUADA</option>
                  </select>
                </div>
                <div>
                  <label>Complexidade</label>
                  <select value={aForm.complexidade} onChange={(e)=>setAForm(f=>({...f, complexidade:e.target.value}))}>
                    <option value="BAIXA">BAIXA</option>
                    <option value="MEDIA">MÉDIA</option>
                    <option value="ALTA">ALTA</option>
                  </select>
                </div>
              </div>

              <label>Descrição do objeto</label>
              <textarea value={aForm.descricao} onChange={(e)=>setAForm(f=>({...f, descricao:e.target.value}))} placeholder="Ex: Aquisição de tinta acrílica para manutenção predial..." />

              <div className="row two">
                <div>
                  <label>Quantidade</label>
                  <input value={aForm.quantidade} onChange={(e)=>setAForm(f=>({...f, quantidade:e.target.value}))} placeholder="Ex: 10 latas de 18L" />
                </div>
                <div>
                  <label>Valor estimado (R$)</label>
                  <input value={aForm.valor_estimado} onChange={(e)=>setAForm(f=>({...f, valor_estimado:e.target.value}))} type="number" step="0.01" placeholder="Ex: 3500.00" />
                </div>
              </div>

              <div className="row two">
                <div>
                  <label>Prazo (dias)</label>
                  <input value={aForm.prazo} onChange={(e)=>setAForm(f=>({...f, prazo:e.target.value}))} type="number" step="1" placeholder="Ex: 30" />
                </div>
                <div>
                  <label>Observações</label>
                  <input value={aForm.observacoes} onChange={(e)=>setAForm(f=>({...f, observacoes:e.target.value}))} placeholder="Opcional" />
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
                <button className="btn primary" onClick={criarAquisicao}>Salvar aquisição</button>
                <button className="btn" onClick={carregarAquisicoes}>Atualizar lista</button>
              </div>

              <Toast kind={appKind}>{appMsg}</Toast>

              {analise && (
                <div className="kvs">
                  <KV k="Justificativa da modalidade" v={analise.analise?.justificativa_modalidade} />
                  <KV k="Justificativa da necessidade" v={analise.analise?.justificativa_necessidade} />
                  <KV k="Normas aplicáveis" v={analise.analise?.normas_aplicaveis} />
                  <KV k="Garantia (meses)" v={analise.analise?.garantia_meses} />
                  <KV k="ETP" v={analise.regras?.etp?.gera ? 'SIM' : 'NÃO'} />
                  <KV k="Motivo ETP" v={analise.regras?.etp?.justificativa} />
                  <KV k="Mapa de Risco" v={analise.regras?.mapa_risco?.gera ? 'SIM' : 'NÃO'} />
                  <KV k="Motivo Mapa de Risco" v={analise.regras?.mapa_risco?.justificativa} />
                </div>
              )}
            </div>

            <div className="card">
              <h2>Minhas aquisições</h2>
              <div className="hint">Clique em uma aquisição para ver detalhes e gerar documentos.</div>
              <div className="list">
                {aquisicoes.length === 0 ? (
                  <div className="hint">Nenhuma aquisição ainda. Crie uma ao lado.</div>
                ) : aquisicoes.map(a => (
                  <div className="item" key={a.id}>
                    <div className="item-head">
                      <div>
                        <div className="item-title">#{a.id} • {(a.descricao || 'Sem descrição').slice(0, 80)}{(a.descricao || '').length > 80 ? '…' : ''}</div>
                        <div className="item-sub">{a.modalidade} • {a.tipo_contratacao} • {money(a.valor_estimado)}</div>
                      </div>
                      <button className="btn" onClick={()=>selecionarAquisicao(a.id)}>Abrir</button>
                    </div>
                    <div className="tags">
                      <span className={`tag ${a.gera_etp === 'SIM' ? 'warn' : ''}`}>ETP: {a.gera_etp || '—'}</span>
                      <span className={`tag ${a.gera_mapa_risco === 'SIM' ? 'warn' : ''}`}>Mapa: {a.gera_mapa_risco || '—'}</span>
                      <span className="tag">Complex.: {a.complexidade || '—'}</span>
                      <span className="tag">Prazo: {a.prazo ?? '—'} dias</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Detalhes da aquisição</h2>

            {!aquisicaoSel ? (
              <div className="hint">Selecione uma aquisição para ver os detalhes aqui.</div>
            ) : (
              <div className="kvs">
                <KV k="ID" v={aquisicaoSel.id} />
                <KV k="Modalidade" v={aquisicaoSel.modalidade} />
                <KV k="Hipótese" v={aquisicaoSel.hipotese_dispensa || '—'} />
                <KV k="Tipo" v={aquisicaoSel.tipo_contratacao} />
                <KV k="Descrição" v={aquisicaoSel.descricao} />
                <KV k="Quantidade" v={aquisicaoSel.quantidade || '—'} />
                <KV k="Valor estimado" v={money(aquisicaoSel.valor_estimado)} />
                <KV k="Complexidade" v={aquisicaoSel.complexidade || '—'} />
                <KV k="Prazo (dias)" v={aquisicaoSel.prazo ?? '—'} />
                <KV k="ETP" v={`${aquisicaoSel.gera_etp} — ${aquisicaoSel.motivo_etp || ''}`} />
                <KV k="Mapa de Risco" v={`${aquisicaoSel.gera_mapa_risco} — ${aquisicaoSel.motivo_mapa_risco || ''}`} />
                <KV k="Normas aplicáveis" v={aquisicaoSel.normas_aplicaveis || '—'} />
                <KV k="Garantia (meses)" v={aquisicaoSel.garantia_meses ?? '—'} />
                <KV k="Observações" v={aquisicaoSel.observacoes || '—'} />
              </div>
            )}

            <div className="sep" />
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <button className="btn primary" disabled={!aquisicaoSel || gerandoDocs} onClick={gerarDocumentos}>
                {gerandoDocs ? 'Gerando…' : 'Gerar documentos (DOCX)'}
              </button>
              <span className="hint">Os arquivos aparecem abaixo para baixar.</span>
            </div>

            {docs && (
              <div className="kvs">
                {docs.map(d => (
                  <div className="kv" key={d.url}>
                    <b>{d.tipo}</b>
                    <span><a href={d.url} target="_blank" rel="noreferrer">Baixar: {d.nome}</a></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <footer>
        Backend: Express + SQLite + Sessões (cookie) • Rotas: <code>/api/*</code> • Arquivos em <code>/documentos</code>
      </footer>
    </div>
  );
}
