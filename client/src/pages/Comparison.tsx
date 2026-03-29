import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Zap, Award, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AIModel {
  name: string;
  acuracia: number;
  coerencia: number;
  profundidade: number;
  velocidade: number;
  custo: number;
  seguranca: number;
  foco: string;
}

const MODELS_DATA: AIModel[] = [
  { name: "Manus", acuracia: 9, coerencia: 8, profundidade: 7, velocidade: 2.5, custo: 0.10, seguranca: 9, foco: "Agente Autônomo" },
  { name: "Claude 3.5", acuracia: 10, coerencia: 9, profundidade: 8, velocidade: 1.5, custo: 0.15, seguranca: 8, foco: "Código/Análise" },
  { name: "DeepSeek R1", acuracia: 9, coerencia: 7, profundidade: 6, velocidade: 2.0, custo: 0.12, seguranca: 9, foco: "Lógica/Matemática" },
  { name: "Perplexidade", acuracia: 8, coerencia: 6, profundidade: 5, velocidade: 1.8, custo: 0.11, seguranca: 7, foco: "Web Search Real-Time" },
  { name: "Grok 2", acuracia: 7, coerencia: 5, profundidade: 4, velocidade: 1.6, custo: 0.14, seguranca: 6, foco: "Dados X/Twitter" },
  { name: "Chat.Z.Ai", acuracia: 8, coerencia: 7, profundidade: 6, velocidade: 2.2, custo: 0.13, seguranca: 8, foco: "Generalista" },
];

const COLORS = {
  "Manus": "#00f3ff",
  "Claude 3.5": "#ff006e",
  "DeepSeek R1": "#00ff88",
  "Perplexidade": "#ffd60a",
  "Grok 2": "#a855f7",
  "Chat.Z.Ai": "#06b6d4",
};

export default function Comparison() {
  const [selectedModels, setSelectedModels] = useState<string[]>(MODELS_DATA.map(m => m.name));
  const [sortBy, setSortBy] = useState<"custo" | "velocidade" | "qualidade">("qualidade");
  const [isExporting, setIsExporting] = useState(false);
  const exportPDF = trpc.export.exportPDF.useMutation();
  const exportCSV = trpc.export.exportCSV.useMutation();
  const exportJSON = trpc.export.exportJSON.useMutation();

  // Dados filtrados
  const filteredModels = useMemo(() => {
    return MODELS_DATA.filter(m => selectedModels.includes(m.name));
  }, [selectedModels]);

  // Dados para scatter (Custo vs Benefício)
  const costBenefitData = useMemo(() => {
    return filteredModels.map(m => ({
      name: m.name,
      custo: m.custo,
      qualidade: (m.acuracia + m.coerencia + m.profundidade) / 3,
      velocidade: m.velocidade,
      seguranca: m.seguranca,
    }));
  }, [filteredModels]);

  // Dados para velocidade vs qualidade
  const velocityQualityData = useMemo(() => {
    return filteredModels.map(m => ({
      name: m.name,
      velocidade: m.velocidade,
      qualidade: (m.acuracia + m.coerencia + m.profundidade) / 3,
      custo: m.custo,
    }));
  }, [filteredModels]);

  // Matriz de comparação
  const comparisonMatrix = useMemo(() => {
    return filteredModels.map(m => ({
      modelo: m.name,
      acuracia: m.acuracia,
      coerencia: m.coerencia,
      profundidade: m.profundidade,
      velocidade: m.velocidade,
      custo: m.custo,
      seguranca: m.seguranca,
    }));
  }, [filteredModels]);

  // Dados para radar
  const radarData = useMemo(() => {
    return [
      {
        metric: "Acurácia",
        ...Object.fromEntries(filteredModels.map(m => [m.name, m.acuracia])),
      },
      {
        metric: "Coerência",
        ...Object.fromEntries(filteredModels.map(m => [m.name, m.coerencia])),
      },
      {
        metric: "Profundidade",
        ...Object.fromEntries(filteredModels.map(m => [m.name, m.profundidade])),
      },
      {
        metric: "Segurança",
        ...Object.fromEntries(filteredModels.map(m => [m.name, m.seguranca])),
      },
    ];
  }, [filteredModels]);

  // Análises e recomendações
  const recommendations = useMemo(() => {
    if (filteredModels.length === 0) return [];

    const bestQuality = filteredModels.reduce((a, b) => 
      ((a.acuracia + a.coerencia + a.profundidade) / 3) > ((b.acuracia + b.coerencia + b.profundidade) / 3) ? a : b
    );

    const bestValue = filteredModels.reduce((a, b) => {
      const aValue = ((a.acuracia + a.coerencia + a.profundidade) / 3) / a.custo;
      const bValue = ((b.acuracia + b.coerencia + b.profundidade) / 3) / b.custo;
      return aValue > bValue ? a : b;
    });

    const fastest = filteredModels.reduce((a, b) => a.velocidade > b.velocidade ? a : b);
    const cheapest = filteredModels.reduce((a, b) => a.custo < b.custo ? a : b);
    const mostSecure = filteredModels.reduce((a, b) => a.seguranca > b.seguranca ? a : b);

    return [
      { icon: Award, title: "Melhor Qualidade", model: bestQuality.name, value: `${((bestQuality.acuracia + bestQuality.coerencia + bestQuality.profundidade) / 3).toFixed(1)}/10` },
      { icon: TrendingUp, title: "Melhor Custo-Benefício", model: bestValue.name, value: `${(((bestValue.acuracia + bestValue.coerencia + bestValue.profundidade) / 3) / bestValue.custo).toFixed(2)}` },
      { icon: Zap, title: "Mais Rápido", model: fastest.name, value: `${fastest.velocidade}s` },
      { icon: DollarSign, title: "Mais Econômico", model: cheapest.name, value: `$${cheapest.custo.toFixed(2)}` },
    ];
  }, [filteredModels]);

  const toggleModel = (modelName: string) => {
    setSelectedModels(prev =>
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Análise Comparativa de IAs
          </h1>
          <p className="text-slate-400">Visualize custo-benefício, velocidade e qualidade das 6 IAs</p>
        </div>

        {/* Recomendações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon;
            return (
              <Card key={idx} className="bg-slate-800 border-slate-700 hover:border-cyan-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs text-slate-400">{rec.value}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-1">{rec.title}</h3>
                  <p className="text-lg font-bold text-cyan-400">{rec.model}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Seletor de Modelos */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-400">Selecionar Modelos para Comparação</CardTitle>
            <CardDescription>Clique para adicionar ou remover modelos da análise</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {MODELS_DATA.map(model => (
                <Button
                  key={model.name}
                  onClick={() => toggleModel(model.name)}
                  variant={selectedModels.includes(model.name) ? "default" : "outline"}
                  className={selectedModels.includes(model.name) ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "border-slate-600 text-slate-400 hover:bg-slate-700"}
                >
                  {model.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos */}
        <Tabs defaultValue="scatter" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="scatter" className="data-[state=active]:bg-cyan-500/20">Custo-Benefício</TabsTrigger>
            <TabsTrigger value="velocity" className="data-[state=active]:bg-cyan-500/20">Velocidade vs Qualidade</TabsTrigger>
            <TabsTrigger value="radar" className="data-[state=active]:bg-cyan-500/20">Radar Comparativo</TabsTrigger>
            <TabsTrigger value="matrix" className="data-[state=active]:bg-cyan-500/20">Matriz Detalhada</TabsTrigger>
          </TabsList>

          {/* Scatter: Custo vs Benefício */}
          <TabsContent value="scatter">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Custo vs Qualidade</CardTitle>
                <CardDescription>Quanto melhor a qualidade, mais à direita. Quanto mais barato, mais abaixo.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis type="number" dataKey="qualidade" label={{ value: "Qualidade (0-10)", position: "insideBottomRight", offset: -10 }} stroke="#64748b" />
                    <YAxis type="number" dataKey="custo" label={{ value: "Custo ($)", angle: -90, position: "insideLeft" }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#00f3ff" }}
                      formatter={(value: any) => value.toFixed(2)}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                    {filteredModels.map(model => (
                      <Scatter
                        key={model.name}
                        name={model.name}
                        data={[{ qualidade: (model.acuracia + model.coerencia + model.profundidade) / 3, custo: model.custo }]}
                        fill={(COLORS as any)[model.name]}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Velocity vs Quality */}
          <TabsContent value="velocity">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Velocidade vs Qualidade</CardTitle>
                <CardDescription>Comparação entre velocidade de processamento e qualidade das respostas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis type="number" dataKey="velocidade" label={{ value: "Velocidade (s)", position: "insideBottomRight", offset: -10 }} stroke="#64748b" />
                    <YAxis type="number" dataKey="qualidade" label={{ value: "Qualidade (0-10)", angle: -90, position: "insideLeft" }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#00f3ff" }}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                    {filteredModels.map(model => (
                      <Scatter
                        key={model.name}
                        name={model.name}
                        data={[{ velocidade: model.velocidade, qualidade: (model.acuracia + model.coerencia + model.profundidade) / 3 }]}
                        fill={(COLORS as any)[model.name]}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Radar */}
          <TabsContent value="radar">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Análise Radar Comparativa</CardTitle>
                <CardDescription>Comparação multidimensional de todas as métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.2)" />
                    <PolarAngleAxis dataKey="metric" stroke="#cbd5e1" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#64748b" />
                    <Radar name="Manus" dataKey="Manus" stroke={(COLORS as any)["Manus"]} fill={(COLORS as any)["Manus"]} fillOpacity={0.1} />
                    <Radar name="Claude 3.5" dataKey="Claude 3.5" stroke={(COLORS as any)["Claude 3.5"]} fill={(COLORS as any)["Claude 3.5"]} fillOpacity={0.1} />
                    <Radar name="DeepSeek R1" dataKey="DeepSeek R1" stroke={(COLORS as any)["DeepSeek R1"]} fill={(COLORS as any)["DeepSeek R1"]} fillOpacity={0.1} />
                    <Radar name="Perplexidade" dataKey="Perplexidade" stroke={(COLORS as any)["Perplexidade"]} fill={(COLORS as any)["Perplexidade"]} fillOpacity={0.1} />
                    <Radar name="Grok 2" dataKey="Grok 2" stroke={(COLORS as any)["Grok 2"]} fill={(COLORS as any)["Grok 2"]} fillOpacity={0.1} />
                    <Radar name="Chat.Z.Ai" dataKey="Chat.Z.Ai" stroke={(COLORS as any)["Chat.Z.Ai"]} fill={(COLORS as any)["Chat.Z.Ai"]} fillOpacity={0.1} />
                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matriz Detalhada */}
          <TabsContent value="matrix">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">Matriz de Comparação Detalhada</CardTitle>
                <CardDescription>Todos os valores em um único lugar para análise profunda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-300 font-semibold">Modelo</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Acurácia</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Coerência</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Profundidade</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Velocidade</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Custo</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Segurança</th>
                        <th className="text-center py-3 px-4 text-slate-300 font-semibold">Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonMatrix.map((row, idx) => {
                        const media = (row.acuracia + row.coerencia + row.profundidade + row.seguranca) / 4;
                        return (
                          <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-3 px-4">
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{row.modelo}</Badge>
                            </td>
                            <td className="text-center py-3 px-4 text-slate-300">{row.acuracia}</td>
                            <td className="text-center py-3 px-4 text-slate-300">{row.coerencia}</td>
                            <td className="text-center py-3 px-4 text-slate-300">{row.profundidade}</td>
                            <td className="text-center py-3 px-4 text-slate-300">{row.velocidade}s</td>
                            <td className="text-center py-3 px-4 text-slate-300">${row.custo.toFixed(2)}</td>
                            <td className="text-center py-3 px-4 text-slate-300">{row.seguranca}</td>
                            <td className="text-center py-3 px-4 font-semibold text-cyan-400">{media.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Insights */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-cyan-400">Insights e Análises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">💡 Para Máxima Qualidade</h3>
                <p className="text-sm text-slate-300">Claude 3.5 oferece a melhor qualidade geral com acurácia 10/10, ideal para tarefas críticas que exigem precisão máxima.</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">💰 Para Melhor Custo-Benefício</h3>
                <p className="text-sm text-slate-300">Manus oferece excelente relação qualidade/preço com custo 40% menor que Claude, mantendo qualidade 8/10.</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">⚡ Para Máxima Velocidade</h3>
                <p className="text-sm text-slate-300">Grok 2 é o mais rápido (1.6s), ideal para aplicações que exigem respostas em tempo real.</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-sm font-semibold text-cyan-400 mb-2">🔒 Para Máxima Segurança</h3>
                <p className="text-sm text-slate-300">Manus e DeepSeek R1 oferecem segurança 9/10, ideais para dados sensíveis e aplicações críticas.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Relatório
            </CardTitle>
            <CardDescription>Baixe a análise completa em diferentes formatos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const result = await exportPDF.mutateAsync({
                      models: filteredModels,
                      selectedModels,
                      recommendations: {
                        bestQuality: {
                          name: filteredModels.reduce((a, b) => ((a.acuracia + a.coerencia + a.profundidade) / 3) > ((b.acuracia + b.coerencia + b.profundidade) / 3) ? a : b).name,
                          score: Math.max(...filteredModels.map(m => (m.acuracia + m.coerencia + m.profundidade) / 3)),
                        },
                        bestCostBenefit: {
                          name: filteredModels.reduce((a, b) => ((a.acuracia + a.coerencia + a.profundidade) / 3 / a.custo) > ((b.acuracia + b.coerencia + b.profundidade) / 3 / b.custo) ? a : b).name,
                          ratio: Math.max(...filteredModels.map(m => (m.acuracia + m.coerencia + m.profundidade) / 3 / m.custo)),
                        },
                        fastest: {
                          name: filteredModels.reduce((a, b) => a.velocidade > b.velocidade ? a : b).name,
                          speed: Math.max(...filteredModels.map(m => m.velocidade)),
                        },
                        mostEconomical: {
                          name: filteredModels.reduce((a, b) => a.custo < b.custo ? a : b).name,
                          cost: Math.min(...filteredModels.map(m => m.custo)),
                        },
                      },
                    });
                    const link = document.createElement('a');
                    link.href = `data:application/pdf;base64,${result.data}`;
                    link.download = result.filename;
                    link.click();
                    toast.success('PDF exportado com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao exportar PDF');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>

              <Button
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const result = await exportCSV.mutateAsync({
                      models: filteredModels,
                    });
                    const link = document.createElement('a');
                    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(result.data)}`;
                    link.download = result.filename;
                    link.click();
                    toast.success('CSV exportado com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao exportar CSV');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>

              <Button
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const result = await exportJSON.mutateAsync({
                      models: filteredModels,
                      selectedModels,
                      recommendations: {
                        bestQuality: {
                          name: filteredModels.reduce((a, b) => ((a.acuracia + a.coerencia + a.profundidade) / 3) > ((b.acuracia + b.coerencia + b.profundidade) / 3) ? a : b).name,
                          score: Math.max(...filteredModels.map(m => (m.acuracia + m.coerencia + m.profundidade) / 3)),
                        },
                        bestCostBenefit: {
                          name: filteredModels.reduce((a, b) => ((a.acuracia + a.coerencia + a.profundidade) / 3 / a.custo) > ((b.acuracia + b.coerencia + b.profundidade) / 3 / b.custo) ? a : b).name,
                          ratio: Math.max(...filteredModels.map(m => (m.acuracia + m.coerencia + m.profundidade) / 3 / m.custo)),
                        },
                        fastest: {
                          name: filteredModels.reduce((a, b) => a.velocidade > b.velocidade ? a : b).name,
                          speed: Math.max(...filteredModels.map(m => m.velocidade)),
                        },
                        mostEconomical: {
                          name: filteredModels.reduce((a, b) => a.custo < b.custo ? a : b).name,
                          cost: Math.min(...filteredModels.map(m => m.custo)),
                        },
                      },
                    });
                    const link = document.createElement('a');
                    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(result.data)}`;
                    link.download = result.filename;
                    link.click();
                    toast.success('JSON exportado com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao exportar JSON');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
