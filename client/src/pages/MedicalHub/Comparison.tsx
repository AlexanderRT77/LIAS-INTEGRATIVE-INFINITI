import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { AlertCircle, Trophy, TrendingUp, Zap } from "lucide-react";

const AI_MODELS = [
  { name: "Claude", color: "#00f3ff", icon: "🤖" },
  { name: "GPT-4", color: "#00ff88", icon: "🧠" },
  { name: "Gemini", color: "#ff007f", icon: "✨" },
  { name: "DeepSeek", color: "#3b82f6", icon: "🔍" },
  { name: "Perplexity", color: "#f59e0b", icon: "🌐" },
  { name: "Grok", color: "#ef4444", icon: "⚡" },
];

export default function MedicalComparison() {
  const { user, isAuthenticated } = useAuth();
  const benchmarks = trpc.medicalHub.benchmarks.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        </Card>
      </div>
    );
  }

  const benchmarkData = benchmarks.data || [];

  // Prepare data for different visualizations
  const comparisonData = AI_MODELS.map((model) => {
    const benchmark = benchmarkData.find(
      (b) => b.aiModel.toLowerCase() === model.name.toLowerCase()
    );
    return {
      name: model.name,
      icon: model.icon,
      color: model.color,
      elo: benchmark?.elo || 0,
      accuracy: benchmark?.diagnosticAccuracy || 0,
      falsePositive: benchmark?.falsePositiveRate || 0,
      falseNegative: benchmark?.falseNegativeRate || 0,
      responseTime: benchmark?.responseTime || 0,
      successRate: benchmark?.successRate || 0,
      cost: parseFloat(benchmark?.costPerAnalysis || "0"),
    };
  });

  const radarData = comparisonData.map((model) => ({
    name: model.name,
    accuracy: model.accuracy,
    successRate: model.successRate,
    eloScore: (model.elo / 10) * 100, // Normalize ELO for radar
    speed: Math.min((1000 / (model.responseTime || 1)) * 100, 100), // Normalize speed
  }));

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-pink-400">⚖️ Comparação de IAs</h1>
        <p className="text-muted-foreground">
          Análise comparativa das 6 IAs em diagnósticos médicos
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="accuracy">Acurácia</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="radar">Radar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.map((model) => (
              <Card
                key={model.name}
                className="p-6 border-pink-400/20 hover:border-pink-400/50 transition"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{model.icon}</span>
                      <h3 className="text-lg font-bold" style={{ color: model.color }}>
                        {model.name}
                      </h3>
                    </div>
                    {model.elo > 1600 && <Trophy className="h-5 w-5 text-yellow-400" />}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ELO Rating</span>
                      <span className="font-bold" style={{ color: model.color }}>
                        {model.elo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acurácia</span>
                      <span className="font-bold text-green-400">{model.accuracy.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Sucesso</span>
                      <span className="font-bold text-blue-400">
                        {model.successRate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo Resposta</span>
                      <span className="font-bold text-cyan-400">{model.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo</span>
                      <span className="font-bold text-orange-400">${model.cost.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-pink-400/20">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Falso Positivo</p>
                        <p className="text-sm font-bold text-red-400">
                          {model.falsePositive.toFixed(2)}%
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Falso Negativo</p>
                        <p className="text-sm font-bold text-red-400">
                          {model.falseNegative.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Accuracy Tab */}
        <TabsContent value="accuracy">
          <Card className="p-6 border-pink-400/20">
            <h2 className="text-2xl font-bold mb-6 text-pink-400">📊 Comparação de Acurácia</h2>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(255,0,127,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#00ff88" name="Acurácia (%)" />
                  <Bar dataKey="successRate" fill="#3b82f6" name="Taxa Sucesso (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card className="p-6 border-pink-400/20">
            <h2 className="text-2xl font-bold mb-6 text-pink-400">⚡ Performance</h2>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis
                    dataKey="responseTime"
                    name="Tempo Resposta (ms)"
                    stroke="rgba(224,249,255,0.7)"
                  />
                  <YAxis
                    dataKey="cost"
                    name="Custo ($)"
                    stroke="rgba(224,249,255,0.7)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(255,0,127,0.3)",
                      borderRadius: "8px",
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  {comparisonData.map((model, idx) => (
                    <Scatter
                      key={model.name}
                      name={model.name}
                      data={[model]}
                      fill={model.color}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Radar Tab */}
        <TabsContent value="radar">
          <Card className="p-6 border-pink-400/20">
            <h2 className="text-2xl font-bold mb-6 text-pink-400">🎯 Análise Multidimensional</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(0,243,255,0.2)" />
                  <PolarAngleAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                  <PolarRadiusAxis stroke="rgba(224,249,255,0.7)" />
                  <Radar
                    name="Acurácia"
                    dataKey="accuracy"
                    stroke="#00ff88"
                    fill="#00ff88"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Taxa Sucesso"
                    dataKey="successRate"
                    stroke="#00f3ff"
                    fill="#00f3ff"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="ELO Score"
                    dataKey="eloScore"
                    stroke="#ff007f"
                    fill="#ff007f"
                    fillOpacity={0.1}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(255,0,127,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card className="mt-8 p-6 border-pink-400/20">
        <h3 className="text-lg font-bold text-pink-400 mb-4">📋 Legenda das IAs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {AI_MODELS.map((model) => (
            <div key={model.name} className="flex items-center gap-2">
              <span className="text-2xl">{model.icon}</span>
              <div>
                <p className="font-semibold text-sm">{model.name}</p>
                <div
                  className="h-2 w-12 rounded"
                  style={{ backgroundColor: model.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
