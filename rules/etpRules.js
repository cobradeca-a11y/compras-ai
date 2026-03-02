function decidirETP(modalidade, hipotese_dispensa, tipo_contratacao, complexidade) {
  let gera = false, tipo = 'NAO_GERA', justificativa = '';

  if (modalidade === 'dispensa' && hipotese_dispensa === 'dispensa_por_valor') {
    gera = false; tipo = 'FACULTATIVO';
    justificativa = 'Art. 14, I da IN SEGES 58/2022 - Dispensa por valor: ETP facultativo.';
  } else if (complexidade === 'alta' || tipo_contratacao === 'obra' || tipo_contratacao === 'engenharia') {
    gera = true; tipo = 'OBRIGATORIO';
    justificativa = 'Art. 14, II da IN SEGES 58/2022 - Alta complexidade/obra: ETP obrigatório.';
  } else if (modalidade === 'pregao' || modalidade === 'concorrencia') {
    gera = true; tipo = 'OBRIGATORIO';
    justificativa = `Modalidade ${modalidade.toUpperCase()} exige ETP.`;
  } else {
    tipo = 'FACULTATIVO';
    justificativa = 'ETP facultativo para esta contratação.';
  }

  return { gera, tipo, justificativa };
}

module.exports = { decidirETP };