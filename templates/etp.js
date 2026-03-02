const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

async function gerarETP(aquisicao, usuario, docsDir) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "ESTUDO TÉCNICO PRELIMINAR (ETP)",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Conforme Art. 18, §1º da Lei 14.133/2021 e IN SEGES 58/2022", alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "1. DESCRIÇÃO DO OBJETO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.descricao }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "2. FUNDAMENTAÇÃO DA CONTRATAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.justificativa_necessidade }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "3. ANÁLISE DE VIABILIDADE", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "A contratação mostra-se viável considerando:" }),
        new Paragraph({ text: "• Necessidade institucional comprovada" }),
        new Paragraph({ text: "• Disponibilidade orçamentária" }),
        new Paragraph({ text: "• Conformidade legal" }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "4. REQUISITOS DA CONTRATAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.normas_aplicaveis }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "5. ESTIMATIVA DE CUSTOS", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Valor estimado: R$ ${parseFloat(aquisicao.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` }),
        new Paragraph({ text: "Baseado em pesquisa de mercado e preços praticados." }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "6. JUSTIFICATIVA ETP", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.motivo_etp }),
      ]
    }]
  });

  const fileName = `ETP_${aquisicao.id}_${Date.now()}.docx`;
  const filePath = path.join(docsDir, fileName);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

module.exports = { gerarETP };