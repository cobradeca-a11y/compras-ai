const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

async function gerarTR(aquisicao, usuario, docsDir) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "TERMO DE REFERÊNCIA",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "1. DO OBJETO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Contratação de ${aquisicao.tipo_contratacao}: ${aquisicao.descricao}` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "2. DA JUSTIFICATIVA", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.justificativa_necessidade }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "3. DA ESPECIFICAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun({ text: "Tipo: ", bold: true }), new TextRun(aquisicao.tipo_contratacao)] }),
        new Paragraph({ children: [new TextRun({ text: "Quantidade: ", bold: true }), new TextRun(aquisicao.quantidade)] }),
        new Paragraph({ children: [new TextRun({ text: "Complexidade: ", bold: true }), new TextRun(aquisicao.complexidade)] }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "4. DOS REQUISITOS TÉCNICOS", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.normas_aplicaveis }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "5. DA GARANTIA", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Garantia mínima de ${aquisicao.garantia_meses} meses conforme CDC.` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "6. DO PRAZO DE EXECUÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.prazo ? `${aquisicao.prazo} dias` : 'Conforme cronograma' }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "7. DO VALOR ESTIMADO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `R$ ${parseFloat(aquisicao.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "8. DA MODALIDADE", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.modalidade.toUpperCase() }),
        new Paragraph({ text: aquisicao.justificativa_modalidade }),
      ]
    }]
  });

  const fileName = `TR_${aquisicao.id}_${Date.now()}.docx`;
  const filePath = path.join(docsDir, fileName);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

module.exports = { gerarTR };