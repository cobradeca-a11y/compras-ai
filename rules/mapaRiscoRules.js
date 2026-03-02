function decidirMapaRisco(tipo, valor, complexidade, prazo) {
  let nivelRisco = 'BAIXO', justificativa = '';

  if (tipo === 'obra' || tipo === 'engenharia' || complexidade === 'alta' || valor > 350000) {
    nivelRisco = 'ALTO';
    justificativa = 'Contratação alta complexidade/valor elevado. Gerenciamento estruturado necessário (TCU).';
  } else if (complexidade === 'media' || (valor > 50000 && valor <= 350000)) {
    nivelRisco = 'MEDIO';
    justificativa = 'Complexidade moderada. Análise simplificada recomendada.';
  } else {
    justificativa = 'Compra simples. Gerenciamento proporcional.';
  }

  let gera = nivelRisco !== 'BAIXO';
  let tipo_geracao = nivelRisco === 'ALTO' ? 'COMPLETO' : nivelRisco === 'MEDIO' ? 'SIMPLIFICADO' : 'NAO_GERA';

  return { gera, tipo_geracao, nivel_risco: nivelRisco, justificativa };
}

module.exports = { decidirMapaRisco };