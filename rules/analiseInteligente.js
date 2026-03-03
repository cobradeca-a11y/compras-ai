function analisarObjeto(descricao, tipo_contratacao, valor_estimado) {
  const desc = descricao.toLowerCase();
  let justificativa_modalidade = '';
  let justificativa_necessidade = '';
  let normas_aplicaveis = '';
  let garantia_meses = 12;

  // Análise para justificativa da modalidade
  if (tipo_contratacao === 'produto') {
    justificativa_modalidade = 'A aquisição de bens materiais enquadra-se na modalidade selecionada conforme art. 75 da Lei 14.133/2021, considerando o valor estimado e a natureza padronizada do objeto.';
  } else if (tipo_contratacao === 'servico') {
    justificativa_modalidade = 'A contratação de serviços justifica-se pela modalidade escolhida, em conformidade com a Lei 14.133/2021, atendendo aos princípios da eficiência e economicidade.';
  } else if (tipo_contratacao === 'obra' || tipo_contratacao === 'engenharia') {
    justificativa_modalidade = 'A contratação de obra/engenharia exige procedimento licitatório adequado conforme Lei 14.133/2021, art. 75 e IN SEGES 58/2022, considerando a complexidade técnica envolvida.';
  }

  // Análise inteligente da necessidade
  if (desc.includes('urgente') || desc.includes('emergência')) {
    justificativa_necessidade = 'A aquisição é necessária em caráter urgente para manutenção das atividades essenciais do órgão, evitando paralisação dos serviços públicos e prejuízos à administração.';
  } else if (desc.includes('equipamento') || desc.includes('material')) {
    justificativa_necessidade = 'A aquisição se faz necessária para reposição/modernização de equipamentos/materiais, visando manter a eficiência operacional e a qualidade dos serviços prestados à população.';
  } else if (desc.includes('manutenção') || desc.includes('reforma')) {
    justificativa_necessidade = 'A contratação é essencial para garantir a manutenção adequada das instalações e equipamentos, assegurando a continuidade e qualidade dos serviços públicos.';
  } else {
    justificativa_necessidade = 'A contratação visa atender demanda institucional, sendo indispensável para o cumprimento das atribuições legais do órgão e garantia da eficiência dos serviços prestados à sociedade.';
  }

  // Normas aplicáveis baseadas no tipo e descrição
  if (desc.includes('informática') || desc.includes('computador') || desc.includes('software')) {
    normas_aplicaveis = 'ABNT NBR ISO/IEC 27001, IN SGD/ME 01/2019';
  } else if (desc.includes('construção') || desc.includes('obra') || desc.includes('reforma')) {
    normas_aplicaveis = 'ABNT NBR 15575, NBR 9050 (Acessibilidade), Código de Obras Municipal';
  } else if (desc.includes('aliment') || desc.includes('cozinha') || desc.includes('refeit')) {
    normas_aplicaveis = 'RDC ANVISA 216/2004, Portaria MS 2914/2011';
  } else if (desc.includes('veículo') || desc.includes('automóvel')) {
    normas_aplicaveis = 'Código de Trânsito Brasileiro, Resoluções CONTRAN';
  } else if (desc.includes('elétric') || desc.includes('energia')) {
    normas_aplicaveis = 'ABNT NBR 5410, NR-10, Normas da concessionária local';
  } else if (desc.includes('segurança') || desc.includes('incêndio')) {
    normas_aplicaveis = 'ABNT NBR 10898, NBR 13434, Corpo de Bombeiros local';
  } else {
    normas_aplicaveis = 'Normas ABNT aplicáveis ao objeto, Código de Defesa do Consumidor (Lei 8.078/1990)';
  }

  // Garantia baseada no CDC e tipo
  if (tipo_contratacao === 'produto') {
    if (desc.includes('durável') || desc.includes('equipamento') || valor_estimado > 5000) {
      garantia_meses = 90 / 30; // 90 dias mínimo CDC
    } else {
      garantia_meses = 30 / 30; // 30 dias CDC
    }
  } else if (tipo_contratacao === 'servico' || tipo_contratacao === 'obra') {
    garantia_meses = 60; // 5 anos para obras conforme CC
  }

  // Arredondar garantia
  garantia_meses = Math.ceil(garantia_meses);

  return {
    justificativa_modalidade,
    justificativa_necessidade,
    normas_aplicaveis,
    garantia_meses
  };
}

module.exports = { analisarObjeto };