const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

async function gerarDFD(aquisicao, usuario, docsDir) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA (DFD)",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Unidade Requisitante: ", bold: true }),
            new TextRun(usuario.unidade)
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Responsável: ", bold: true }),
            new TextRun(`${usuario.nome} - ${usuario.cargo}`)
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Data: ", bold: true }),
            new TextRun(new Date().toLocaleDateString('pt-BR'))
          ]
        }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "1. DESCRIÇÃO DA NECESSIDADE", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.descricao }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "2. JUSTIFICATIVA DA CONTRATAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.justificativa_necessidade }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "3. ESPECIFICAÇÕES DO OBJETO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ children: [new TextRun({ text: "Tipo: ", bold: true }), new TextRun(aquisicao.tipo_contratacao)] }),
        new Paragraph({ children: [new TextRun({ text: "Quantidade: ", bold: true }), new TextRun(aquisicao.quantidade || 'N/A')] }),
        new Paragraph({ children: [new TextRun({ text: "Valor Estimado: ", bold: true }), new TextRun(`R$ ${parseFloat(aquisicao.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`)] }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "4. MODALIDADE DE CONTRATAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.modalidade.toUpperCase() }),
        new Paragraph({ text: aquisicao.justificativa_modalidade }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "5. NORMAS APLICÁVEIS", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.normas_aplicaveis }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "6. APROVAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "_______________________________" }),
        new Paragraph({ text: usuario.nome }),
        new Paragraph({ text: usuario.cargo }),
      ]
    }]
  });

  const fileName = `DFD_${aquisicao.id}_${Date.now()}.docx`;
  const filePath = path.join(docsDir, fileName);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

module.exports = { gerarDFD };