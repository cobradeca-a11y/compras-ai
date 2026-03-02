/**
 * Regras para determinar se deve gerar ETP (Estudo Técnico Preliminar)
 * Baseado na IN SEGES 58/2022
 */

function decidirETP(modalidade, hipotese_dispensa, tipo_contratacao, complexidade) {
  let gera = false;
  let tipo = 'NAO_GERA';
  let justificativa = '';

  // Art. 14, I - Dispensa por valor: ETP é FACULTATIVO
  if (modalidade === 'dispensa' && hipotese_dispensa === 'dispensa_por_valor') {
    gera = false;
    tipo = 'FACULTATIVO';
    justificativa = 'Art. 14, I da IN SEGES 58/2022 - Dispensa por valor até R$ 100.000,00 (bens) ou R$ 200.000,00 (serviços/engenharia): ETP é facultativo, podendo ser substituído por documento simplificado.';
  }
  
  // Art. 14, II - Contratações de alta complexidade: ETP é OBRIGATÓRIO
  else if (
    complexidade === 'alta' || 
    tipo_contratacao === 'obra' || 
    tipo_contratacao === 'engenharia' ||
    tipo_contratacao === 'tic' ||
    tipo_contratacao === 'servico_continuo'
  ) {
    gera = true;
    tipo = 'OBRIGATORIO';
    justificativa = 'Art. 14, II da IN SEGES 58/2022 - Contratações de obras, serviços de engenharia, TIC, serviços continuados ou de alta complexidade exigem ETP obrigatório conforme Lei 14.133/2021, Art. 18, §1º.';
  }
  
  // Pregão/Concorrência: ETP é OBRIGATÓRIO
  else if (modalidade === 'pregao' || modalidade === 'concorrencia') {
    gera = true;
    tipo = 'OBRIGATORIO';
    justificativa = `Art. 14, II da IN SEGES 58/2022 - Modalidade ${modalidade.toUpperCase()} exige ETP para fundamentar a contratação e demonstrar viabilidade técnica e econômica.`;
  }
  
  // Demais casos: FACULTATIVO
  else {
    gera = false;
    tipo = 'FACULTATIVO';
    justificativa = 'Para esta contratação, o ETP é facultativo, podendo ser elaborado documento simplificado de acordo com a necessidade do órgão.';
  }

  return {
    gera,
    tipo,
    justificativa
  };
}

module.exports = { decidirETP };
