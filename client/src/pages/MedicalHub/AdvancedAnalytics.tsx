import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { AlertCircle, Download, TrendingUp, Activity } from "lucide-react";

export default function AdvancedAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const [metric, setMetric] = useState("accuracy");

  const benchmarks = trpc.medicalHub.benchmarks.list.useQuery();
  const validationStats = trpc.medicalHub.validationHistory.getStats.useQuery();

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

  // Sample analytics data
  const timeSeriesData = [
    { time: "00:00", accuracy: 92, volume: 45, cost: 2.3 },
    { time: "04:00", accuracy: 94, volume: 38, cost: 1.9 },
    { time: "08:00", accuracy: 91, volume: 62, cost: 3.1 },
    { time: "12:00", accuracy: 95, volume: 78, cost: 3.9 },
    { time: "16:00", accuracy: 93, volume: 55, cost: 2.8 },
    { time: "20:00", accuracy: 96, volume: 42, cost: 2.1 },
    { time: "24:00", accuracy: 94, volume: 35, cost: 1.7 },
  ];

  const modelPerformance = [
    { name: "Claude", accuracy: 95, speed: 380, reliability: 98, cost: 0.003 },
    { name: "GPT-4", accuracy: 94, speed: 420, reliability: 97, cost: 0.03 },
    { name: "Gemini", accuracy: 92, speed: 350, reliability: 95, cost: 0.0005 },
    { name: "DeepSeek", accuracy: 91, speed: 400, reliability: 94, cost: 0.0014 },
    { name: "Perplexity", accuracy: 90, speed: 450, reliability: 92, cost: 0.008 },
    { name: "Grok", accuracy: 89, speed: 480, reliability: 90, cost: 0.002 },
  ];

  const costVsAccuracy = modelPerformance.map((m) => ({
    name: m.name,
    cost: m.cost * 1000, // Convert to cents for visibility
    accuracy: m.accuracy,
  }));

  const stats = validationStats.data;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-indigo-400">📊 Analytics Avançado</h1>
        <p className="text-muted-foreground">
          Análise profunda de dados com visualizações interativas
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6 border-indigo-400/20 mb-8">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-indigo-400 font-semibold mb-2 block">Período</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="border-indigo-400/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label className="text-indigo-400 font-semibold mb-2 block">Métrica</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="border-indigo-400/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Acurácia</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="cost">Custo</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-indigo-500 hover:bg-indigo-600 text-black font-bold">
            Atualizar
          </Button>

          <Button variant="outline" className="text-indigo-400 hover:text-indigo-300">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border-indigo-400/30 bg-indigo-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa Média</p>
              <p className="text-3xl font-bold text-indigo-400">{stats?.accuracyRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-green-400/30 bg-green-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Análises</p>
            <p className="text-3xl font-bold text-green-400">{stats?.total || 0}</p>
          </div>
        </Card>

        <Card className="p-6 border-blue-400/30 bg-blue-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Custo Médio</p>
            <p className="text-3xl font-bold text-blue-400">$0.008</p>
          </div>
        </Card>

        <Card className="p-6 border-orange-400/30 bg-orange-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Throughput</p>
            <p className="text-3xl font-bold text-orange-400">1.2K/h</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeseries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeseries">Série Temporal</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="scatter">Correlação</TabsTrigger>
          <TabsTrigger value="heatmap">Distribuição</TabsTrigger>
        </TabsList>

        {/* Time Series Tab */}
        <TabsContent value="timeseries">
          <Card className="p-6 border-indigo-400/20">
            <h2 className="text-2xl font-bold mb-6 text-indigo-400">📈 Série Temporal</h2>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    fill="#6366f1"
                    stroke="#6366f1"
                    fillOpacity={0.1}
                    name="Acurácia (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#00ff88"
                    name="Volume"
                    yAxisId="right"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <Card className="p-6 border-indigo-400/20">
            <h2 className="text-2xl font-bold mb-6 text-indigo-400">⚖️ Comparação de Modelos</h2>
            {modelPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={modelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#6366f1" name="Acurácia (%)" />
                  <Bar dataKey="reliability" fill="#00ff88" name="Confiabilidade (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Scatter Tab */}
        <TabsContent value="scatter">
          <Card className="p-6 border-indigo-400/20">
            <h2 className="text-2xl font-bold mb-6 text-indigo-400">📊 Custo vs Acurácia</h2>
            {costVsAccuracy.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis
                    dataKey="cost"
                    name="Custo (¢)"
                    stroke="rgba(224,249,255,0.7)"
                  />
                  <YAxis
                    dataKey="accuracy"
                    name="Acurácia (%)"
                    stroke="rgba(224,249,255,0.7)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    name="Modelos"
                    data={costVsAccuracy}
                    fill="#6366f1"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap">
          <Card className="p-6 border-indigo-400/20">
            <h2 className="text-2xl font-bold mb-6 text-indigo-400">🔥 Distribuição de Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-indigo-400/20">
                    <th className="text-left py-3 px-4">Modelo</th>
                    <th className="text-center py-3 px-4">Acurácia</th>
                    <th className="text-center py-3 px-4">Velocidade</th>
                    <th className="text-center py-3 px-4">Confiabilidade</th>
                    <th className="text-center py-3 px-4">Custo-Benefício</th>
                  </tr>
                </thead>
                <tbody>
                  {modelPerformance.map((model) => (
                    <tr
                      key={model.name}
                      className="border-b border-indigo-400/10 hover:bg-indigo-400/5 transition"
                    >
                      <td className="py-3 px-4 font-medium">{model.name}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center">
                          <div className="w-24 h-2 bg-indigo-400/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400"
                              style={{ width: `${model.accuracy}%` }}
                            />
                          </div>
                          <span className="ml-2 text-indigo-400 font-semibold">
                            {model.accuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-blue-400 font-semibold">{model.speed}ms</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-green-400 font-semibold">{model.reliability}%</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-orange-400 font-semibold">
                          ${(model.cost * 1000).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Card className="mt-8 p-6 border-indigo-400/20">
        <h3 className="text-lg font-bold text-indigo-400 mb-4">💡 Insights Automáticos</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">✓</span>
            <span className="text-muted-foreground">
              Pico de acurácia às 20:00 com {stats?.accuracyRate}% de taxa média
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">→</span>
            <span className="text-muted-foreground">
              Claude oferece melhor custo-benefício com 95% de acurácia e 380ms de latência
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-orange-400 font-bold">💰</span>
            <span className="text-muted-foreground">
              Usar Gemini para análises em lote economiza 80% em custos com 92% de acurácia
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
