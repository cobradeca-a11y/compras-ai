/**
 * Determina se deve gerar Mapa de Riscos baseado em critérios de complexidade
 * Conforme orientações do TCU e Lei 14.133/2021
 */

function decidirMapaRisco(tipo, valor, complexidade, prazo) {
  
  // Determinar nível de risco
  let nivelRisco = 'BAIXO';
  let justificativa = '';

  // ALTO RISCO
  if (tipo === 'obra' || 
      tipo === 'engenharia' || 
      tipo === 'tic' ||
      tipo === 'servico_continuo' ||
      tipo === 'manutencao_relevante' ||
      complexidade === 'alta' ||
      valor > 350000) {
    
    nivelRisco = 'ALTO';
    justificativa = 'Contratação de alta complexidade: ';
    
    if (tipo === 'obra' || tipo === 'engenharia') {
      justificativa += 'obra ou serviço de engenharia. ';
    }
    if (tipo === 'tic') {
      justificativa += 'contratação de TIC. ';
    }
    if (tipo === 'servico_continuo') {
      justificativa += 'serviço continuado. ';
    }
    if (valor > 350000) {
      justificativa += `Valor elevado (R$ ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). `;
    }
    if (prazo && prazo < 30) {
      justificativa += 'Prazo curto para execução. ';
    }
    justificativa += 'Necessário gerenciamento estruturado de riscos conforme art. 18, §2º da Lei 14.133/2021 e orientações do TCU.';
  }

  // MÉDIO RISCO
  else if (tipo === 'servico_tecnico' || 
           complexidade === 'media' ||
           (valor > 50000 && valor <= 350000) ||
           (prazo && prazo < 30)) {
    
    nivelRisco = 'MEDIO';
    justificativa = 'Contratação de complexidade moderada: ';
    
    if (tipo === 'servico_tecnico') {
      justificativa += 'serviço técnico especializado. ';
    }
    if (valor > 50000 && valor <= 350000) {
      justificativa += `Valor intermediário (R$ ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). `;
    }
    if (prazo && prazo < 30) {
      justificativa += 'Prazo sensível. ';
    }
    justificativa += 'Recomenda-se análise de riscos simplificada para identificar e mitigar possíveis problemas.';
  }

  // BAIXO RISCO
  else {
    nivelRisco = 'BAIXO';
    justificativa = 'Compra simples e padronizada: ';
    justificativa += `material comum, baixa complexidade, valor reduzido (R$ ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). `;
    justificativa += 'Gerenciamento de riscos proporcional à relevância do objeto, conforme princípio da razoabilidade.';
  }

  // Decidir se gera
  let gera = false;
  let tipo_geracao = '';

  if (nivelRisco === 'ALTO') {
    gera = true;
    tipo_geracao = 'COMPLETO';
  } else if (nivelRisco === 'MEDIO') {
    gera = true;
    tipo_geracao = 'SIMPLIFICADO';
  } else {
    gera = false;
    tipo_geracao = 'NAO_GERA';
  }

  return {
    gera,
    tipo_geracao,
    nivel_risco: nivelRisco,
    justificativa
  };
}

module.exports = { decidirMapaRisco };
