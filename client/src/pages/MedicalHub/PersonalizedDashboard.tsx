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
  BarChart,
  Bar,
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
import { AlertCircle, Settings, TrendingUp, Zap, Clock } from "lucide-react";

export default function PersonalizedDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedModel, setSelectedModel] = useState("all");

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

  const benchmarkData = benchmarks.data || [];
  const stats = validationStats.data;

  // Sample data for personalized insights
  const performanceTrend = [
    { date: "Seg", accuracy: 92, confidence: 88, speed: 450 },
    { date: "Ter", accuracy: 94, confidence: 90, speed: 420 },
    { date: "Qua", accuracy: 91, confidence: 87, speed: 480 },
    { date: "Qui", accuracy: 95, confidence: 92, speed: 410 },
    { date: "Sex", accuracy: 93, confidence: 89, speed: 440 },
    { date: "Sab", accuracy: 96, confidence: 94, speed: 390 },
    { date: "Dom", accuracy: 94, confidence: 91, speed: 430 },
  ];

  const modelComparison = benchmarkData.map((b) => ({
    name: b.aiModel,
    accuracy: b.diagnosticAccuracy || 0,
    speed: b.responseTime || 0,
    cost: parseFloat(b.costPerAnalysis || "0") * 1000, // Convert to cents for visibility
  }));

  const radarData = [
    {
      name: "Acurácia",
      value: stats?.accuracyRate ? parseFloat(stats.accuracyRate) : 0,
    },
    { name: "Velocidade", value: 85 },
    { name: "Custo-Benefício", value: 78 },
    { name: "Confiabilidade", value: 92 },
    { name: "Escalabilidade", value: 88 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-purple-400">
              👤 Dashboard Personalizado
            </h1>
            <p className="text-muted-foreground">
              Insights customizados para {user?.email || "seu perfil"}
            </p>
          </div>
          <Button className="bg-purple-500 hover:bg-purple-600 text-black font-bold">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border-purple-400/30 bg-purple-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Análises Hoje</p>
              <p className="text-3xl font-bold text-purple-400">12</p>
            </div>
            <Zap className="h-8 w-8 text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-green-400/30 bg-green-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa Média</p>
              <p className="text-3xl font-bold text-green-400">{stats?.accuracyRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-blue-400/30 bg-blue-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
              <p className="text-3xl font-bold text-blue-400">420ms</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-orange-400/30 bg-orange-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Custo Hoje</p>
              <p className="text-3xl font-bold text-orange-400">$0.42</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-purple-400/20 mb-8">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label className="text-purple-400 font-semibold mb-2 block">Período</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="border-purple-400/30">
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

          <div className="flex-1">
            <Label className="text-purple-400 font-semibold mb-2 block">Modelo</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="border-purple-400/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Modelos</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gpt4">GPT-4</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="perplexity">Perplexity</SelectItem>
                <SelectItem value="grok">Grok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-purple-500 hover:bg-purple-600 text-black font-bold">
            Atualizar
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card className="p-6 border-purple-400/20">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">📈 Tendência de Performance</h2>
            {performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(168,85,247,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#a855f7"
                    name="Acurácia (%)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#00ff88"
                    name="Confiança (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <Card className="p-6 border-purple-400/20">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">⚖️ Comparação de Modelos</h2>
            {modelComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={modelComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(168,85,247,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#a855f7" name="Acurácia (%)" />
                  <Bar dataKey="cost" fill="#f59e0b" name="Custo (¢)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="space-y-4">
            <Card className="p-6 border-purple-400/20">
              <h2 className="text-2xl font-bold mb-6 text-purple-400">🎯 Análise Multidimensional</h2>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(168,85,247,0.2)" />
                    <PolarAngleAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                    <PolarRadiusAxis stroke="rgba(224,249,255,0.7)" />
                    <Radar
                      name="Seu Perfil"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.1}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,10,26,0.9)",
                        border: "1px solid rgba(168,85,247,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </Card>

            <Card className="p-6 border-purple-400/20">
              <h3 className="text-lg font-bold text-purple-400 mb-4">💡 Principais Insights</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <span className="text-muted-foreground">
                    Sua taxa de acurácia está <span className="text-green-400 font-bold">12% acima</span> da média
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">→</span>
                  <span className="text-muted-foreground">
                    Claude é o modelo mais rápido para suas análises
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 font-bold">💰</span>
                  <span className="text-muted-foreground">
                    Você economizou <span className="text-orange-400 font-bold">$2.34</span> usando modelos mais baratos
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <div className="space-y-4">
            <Card className="p-6 border-purple-400/20">
              <h3 className="text-lg font-bold text-purple-400 mb-4">🎯 Recomendações Personalizadas</h3>
              <div className="space-y-4">
                <div className="p-4 border border-cyan-400/20 rounded-lg">
                  <p className="font-semibold text-cyan-400 mb-2">Otimizar Custo</p>
                  <p className="text-sm text-muted-foreground">
                    Considere usar DeepSeek para análises de rotina. Oferece 95% da acurácia do GPT-4 com 60% de custo menor.
                  </p>
                </div>

                <div className="p-4 border border-green-400/20 rounded-lg">
                  <p className="font-semibold text-green-400 mb-2">Melhorar Velocidade</p>
                  <p className="text-sm text-muted-foreground">
                    Suas análises levam em média 420ms. Use Claude para análises críticas (380ms) e Gemini para análises em lote.
                  </p>
                </div>

                <div className="p-4 border border-pink-400/20 rounded-lg">
                  <p className="font-semibold text-pink-400 mb-2">Aumentar Confiabilidade</p>
                  <p className="text-sm text-muted-foreground">
                    Implemente análise consensual com 3 modelos. Sua taxa de acurácia subiria para 98% com aumento de 30% no custo.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
