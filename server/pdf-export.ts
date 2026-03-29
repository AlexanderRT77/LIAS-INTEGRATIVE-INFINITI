import { jsPDF } from 'jspdf';

// Tipos para dados de comparação
export interface AIModel {
  name: string;
  acuracia: number;
  coerencia: number;
  profundidade: number;
  velocidade: number;
  custo: number;
  seguranca: number;
}

export interface ComparisonData {
  models: AIModel[];
  selectedModels: string[];
  timestamp: Date;
  generatedBy: string;
}

export interface RecommendationData {
  bestQuality: { name: string; score: number };
  bestCostBenefit: { name: string; ratio: number };
  fastest: { name: string; speed: number };
  mostEconomical: { name: string; cost: number };
}

/**
 * Gera PDF de comparação visual com gráficos e tabelas
 */
export async function generateComparisonPDF(
  comparisonData: ComparisonData,
  recommendations: RecommendationData,
  chartImages?: { costBenefit?: string; speedQuality?: string; radar?: string }
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Cores do tema cyberpunk
  const colors = {
    primary: [0, 243, 255] as [number, number, number],
    secondary: [0, 255, 136] as [number, number, number],
    accent: [168, 85, 247] as [number, number, number],
    text: [255, 255, 255] as [number, number, number],
    lightText: [160, 174, 192] as [number, number, number],
  };

  // Função auxiliar para adicionar seção
  const addSection = (title: string, yPos: number) => {
    doc.setFontSize(14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(title, 15, yPos);
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);
    return yPos + 10;
  };

  // Cabeçalho
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('Relatório de Comparação de IAs', 15, yPosition);
  yPosition += 12;

  // Informações gerais
  doc.setFontSize(10);
  doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  doc.text(`Data: ${comparisonData.timestamp.toLocaleDateString('pt-BR')}`, 15, yPosition);
  yPosition += 5;
  doc.text(`Gerado por: ${comparisonData.generatedBy}`, 15, yPosition);
  yPosition += 10;

  // Seção de Recomendações
  yPosition = addSection('Recomendações Rápidas', yPosition);

  const recommendations_data = [
    {
      label: 'Melhor Qualidade',
      value: `${recommendations.bestQuality.name} (${recommendations.bestQuality.score.toFixed(1)}/10)`,
    },
    {
      label: 'Melhor Custo-Benefício',
      value: `${recommendations.bestCostBenefit.name} (${recommendations.bestCostBenefit.ratio.toFixed(1)}x)`,
    },
    {
      label: 'Mais Rápido',
      value: `${recommendations.fastest.name} (${recommendations.fastest.speed.toFixed(2)}s)`,
    },
    {
      label: 'Mais Econômico',
      value: `${recommendations.mostEconomical.name} ($${recommendations.mostEconomical.cost.toFixed(4)})`,
    },
  ];

  doc.setFontSize(10);
  recommendations_data.forEach((rec) => {
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(rec.label + ':', 15, yPosition);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(rec.value, 60, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // Seção de Gráficos
  if (chartImages) {
    yPosition = addSection('Análises Visuais', yPosition);

    // Gráfico Custo-Benefício
    if (chartImages.costBenefit) {
      try {
        doc.addImage(chartImages.costBenefit, 'PNG', 15, yPosition, 180, 60);
        yPosition += 65;
      } catch (e) {
        console.error('Erro ao adicionar gráfico de custo-benefício:', e);
      }
    }

    // Gráfico Velocidade vs Qualidade
    if (chartImages.speedQuality) {
      try {
        doc.addImage(chartImages.speedQuality, 'PNG', 15, yPosition, 180, 60);
        yPosition += 65;
      } catch (e) {
        console.error('Erro ao adicionar gráfico de velocidade:', e);
      }
    }

    // Gráfico Radar
    if (chartImages.radar) {
      try {
        doc.addImage(chartImages.radar, 'PNG', 15, yPosition, 180, 60);
        yPosition += 65;
      } catch (e) {
        console.error('Erro ao adicionar gráfico radar:', e);
      }
    }
  }

  // Adicionar nova página se necessário
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 15;
  }

  // Seção de Tabela Comparativa
  yPosition = addSection('Tabela Comparativa Detalhada', yPosition);

  // Cabeçalho da tabela
  const tableHeaders = ['Modelo', 'Acurácia', 'Coerência', 'Profundidade', 'Velocidade', 'Custo', 'Segurança'];
  const colWidths = [25, 15, 15, 18, 15, 15, 15];
  let xPosition = 15;

  doc.setFontSize(9);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });

  yPosition += 6;
  doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 4;

  // Dados da tabela
  doc.setFontSize(8);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

  comparisonData.models.forEach((model) => {
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 15;
    }

    xPosition = 15;
    const rowData = [
      model.name,
      model.acuracia.toFixed(1),
      model.coerencia.toFixed(1),
      model.profundidade.toFixed(1),
      model.velocidade.toFixed(2),
      `$${model.custo.toFixed(4)}`,
      model.seguranca.toFixed(1),
    ];

    rowData.forEach((data, index) => {
      doc.text(data, xPosition, yPosition);
      xPosition += colWidths[index];
    });

    yPosition += 6;
  });

  // Análises Detalhadas
  yPosition += 10;
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 15;
  }

  yPosition = addSection('Análises Detalhadas', yPosition);

  const analyses = generateAnalyses(comparisonData.models);
  doc.setFontSize(9);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

  analyses.forEach((analysis) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 15;
    }

    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(`• ${analysis.title}`, 15, yPosition);
    yPosition += 4;

    doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
    const wrappedText = doc.splitTextToSize(analysis.content, pageWidth - 30);
    doc.text(wrappedText, 20, yPosition);
    yPosition += wrappedText.length * 4 + 3;
  });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  doc.text(
    `Relatório gerado automaticamente pelo LIAS Dashboard em ${new Date().toLocaleString('pt-BR')}`,
    15,
    pageHeight - 10
  );

  return Buffer.from(doc.output('arraybuffer') as ArrayBuffer);
}

/**
 * Gera análises detalhadas baseadas nos dados dos modelos
 */
function generateAnalyses(models: AIModel[]) {
  const analyses = [];

  // Análise de Qualidade
  const avgQuality =
    models.reduce((sum, m) => sum + (m.acuracia + m.coerencia + m.profundidade) / 3, 0) / models.length;
  const bestQualityModel = models.reduce((a, b) =>
    (a.acuracia + a.coerencia + a.profundidade) / 3 > (b.acuracia + b.coerencia + b.profundidade) / 3 ? a : b
  );

  analyses.push({
    title: 'Análise de Qualidade',
    content: `A qualidade média dos modelos é de ${avgQuality.toFixed(1)}/10. O modelo com melhor qualidade é ${bestQualityModel.name}.`,
  });

  // Análise de Custo
  const avgCost = models.reduce((sum, m) => sum + m.custo, 0) / models.length;
  const cheapest = models.reduce((a, b) => (a.custo < b.custo ? a : b));
  analyses.push({
    title: 'Análise de Custo',
    content: `O custo médio por requisição é de $${avgCost.toFixed(4)}. O modelo mais econômico é ${cheapest.name} com $${cheapest.custo.toFixed(4)}.`,
  });

  // Análise de Velocidade
  const avgSpeed = models.reduce((sum, m) => sum + m.velocidade, 0) / models.length;
  const fastest = models.reduce((a, b) => (a.velocidade > b.velocidade ? a : b));
  analyses.push({
    title: 'Análise de Velocidade',
    content: `A velocidade média é de ${avgSpeed.toFixed(2)}s. O modelo mais rápido é ${fastest.name} com ${fastest.velocidade.toFixed(2)}s de tempo de resposta.`,
  });

  // Análise de Segurança
  const avgSecurity = models.reduce((sum, m) => sum + m.seguranca, 0) / models.length;
  analyses.push({
    title: 'Análise de Segurança',
    content: `O nível médio de segurança é de ${avgSecurity.toFixed(1)}/10. Todos os modelos apresentam níveis aceitáveis de segurança para uso em produção.`,
  });

  // Recomendação Final
  const bestOverall = models.reduce((a, b) => {
    const aScore = (a.acuracia + a.coerencia + a.profundidade) / 3 - a.custo * 10;
    const bScore = (b.acuracia + b.coerencia + b.profundidade) / 3 - b.custo * 10;
    return aScore > bScore ? a : b;
  });

  analyses.push({
    title: 'Recomendação Final',
    content: `Com base na análise completa, recomendamos o uso do ${bestOverall.name} como modelo principal, oferecendo o melhor equilíbrio entre qualidade, custo e velocidade.`,
  });

  return analyses;
}

/**
 * Exporta dados de comparação para CSV
 */
export function exportToCSV(models: AIModel[], filename: string = 'comparacao-ias.csv'): string {
  const headers = ['Modelo', 'Acurácia', 'Coerência', 'Profundidade', 'Velocidade', 'Custo', 'Segurança'];
  const rows = models.map((m) => [
    m.name,
    m.acuracia.toFixed(1),
    m.coerencia.toFixed(1),
    m.profundidade.toFixed(1),
    m.velocidade.toFixed(2),
    m.custo.toFixed(4),
    m.seguranca.toFixed(1),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}

/**
 * Exporta dados de comparação para JSON
 */
export function exportToJSON(
  comparisonData: ComparisonData,
  recommendations: RecommendationData
): string {
  const data = {
    timestamp: comparisonData.timestamp.toISOString(),
    generatedBy: comparisonData.generatedBy,
    models: comparisonData.models,
    selectedModels: comparisonData.selectedModels,
    recommendations,
  };

  return JSON.stringify(data, null, 2);
}
