const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType } = require('docx');
const fs = require('fs');
const path = require('path');

async function gerarMapaRisco(aquisicao, usuario, docsDir) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "MAPA DE RISCOS",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "1. IDENTIFICAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Objeto: ${aquisicao.descricao}` }),
        new Paragraph({ text: `Valor: R$ ${parseFloat(aquisicao.valor_estimado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "2. CLASSIFICAÇÃO DE RISCO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: aquisicao.motivo_mapa_risco }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "3. PRINCIPAIS RISCOS IDENTIFICADOS", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "• Risco de sobrepreço" }),
        new Paragraph({ text: "• Risco de descontinuidade" }),
        new Paragraph({ text: "• Risco de não conformidade" }),
        new Paragraph({ text: "• Risco operacional" }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "4. MEDIDAS DE MITIGAÇÃO", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "• Pesquisa de preços em múltiplas fontes" }),
        new Paragraph({ text: "• Fiscalização contratual rigorosa" }),
        new Paragraph({ text: "• Verificação de conformidade técnica" }),
        new Paragraph({ text: "• Acompanhamento contínuo" }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "5. RESPONSÁVEIS", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Gestor: ${usuario.nome}` }),
        new Paragraph({ text: `Unidade: ${usuario.unidade}` }),
      ]
    }]
  });

  const fileName = `MapaRisco_${aquisicao.id}_${Date.now()}.docx`;
  const filePath = path.join(docsDir, fileName);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

module.exports = { gerarMapaRisco };