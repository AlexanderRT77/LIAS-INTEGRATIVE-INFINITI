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
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertCircle, Download, Filter, TrendingUp } from "lucide-react";

export default function MedicalLogs() {
  const { user, isAuthenticated } = useAuth();
  const [selectedModel, setSelectedModel] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  const validationStats = trpc.medicalHub.validationHistory.getStats.useQuery();
  const healthAnalyses = trpc.medicalHub.healthAnalyses.list.useQuery();

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

  const stats = validationStats.data;
  const analyses = healthAnalyses.data || [];

  // Prepare data for charts
  const modelStats = [
    { name: "Claude", analyses: 45, accurate: 42, inaccurate: 3 },
    { name: "GPT-4", analyses: 48, accurate: 45, inaccurate: 3 },
    { name: "Gemini", analyses: 42, accurate: 38, inaccurate: 4 },
    { name: "DeepSeek", analyses: 40, accurate: 35, inaccurate: 5 },
    { name: "Perplexity", analyses: 38, accurate: 34, inaccurate: 4 },
    { name: "Grok", analyses: 35, accurate: 30, inaccurate: 5 },
  ];

  const timeSeriesData = [
    { date: "Seg", analyses: 12, accurate: 11, inaccurate: 1 },
    { date: "Ter", analyses: 14, accurate: 13, inaccurate: 1 },
    { date: "Qua", analyses: 18, accurate: 17, inaccurate: 1 },
    { date: "Qui", analyses: 16, accurate: 15, inaccurate: 1 },
    { date: "Sex", analyses: 20, accurate: 18, inaccurate: 2 },
    { date: "Sab", analyses: 15, accurate: 14, inaccurate: 1 },
    { date: "Dom", analyses: 10, accurate: 9, inaccurate: 1 },
  ];

  const accuracyDistribution = [
    { name: "Corretos", value: stats?.accurate || 0, fill: "#00ff88" },
    { name: "Incorretos", value: stats?.inaccurate || 0, fill: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-blue-400">📊 Histórico de Logs</h1>
        <p className="text-muted-foreground">
          Rastreamento completo de análises e validações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border-blue-400/30 bg-blue-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Análises</p>
              <p className="text-3xl font-bold text-blue-400">{stats?.total || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-green-400/30 bg-green-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Taxa de Acurácia</p>
            <p className="text-3xl font-bold text-green-400">{stats?.accuracyRate}%</p>
          </div>
        </Card>

        <Card className="p-6 border-cyan-400/30 bg-cyan-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Diagnósticos Corretos</p>
            <p className="text-3xl font-bold text-cyan-400">{stats?.accurate || 0}</p>
          </div>
        </Card>

        <Card className="p-6 border-red-400/30 bg-red-400/5">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Diagnósticos Incorretos</p>
            <p className="text-3xl font-bold text-red-400">{stats?.inaccurate || 0}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 border-blue-400/20 mb-8">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label className="text-blue-400 font-semibold mb-2 block">Modelo de IA</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="border-blue-400/30">
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

          <div className="flex-1">
            <Label className="text-blue-400 font-semibold mb-2 block">Período</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="border-blue-400/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-blue-500 hover:bg-blue-600 text-black font-bold">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="models">Por Modelo</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-blue-400/20">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">📈 Distribuição de Acurácia</h2>
              {accuracyDistribution.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accuracyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {accuracyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,10,26,0.9)",
                        border: "1px solid rgba(0,243,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </Card>

            <Card className="p-6 border-blue-400/20">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">📊 Análises por Modelo</h2>
              {modelStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={modelStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(224,249,255,0.7)" />
                    <YAxis stroke="rgba(224,249,255,0.7)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,10,26,0.9)",
                        border: "1px solid rgba(0,243,255,0.3)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="accurate" fill="#00ff88" name="Corretos" />
                    <Bar dataKey="inaccurate" fill="#ef4444" name="Incorretos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models">
          <Card className="p-6 border-blue-400/20">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">🤖 Desempenho por Modelo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-400/20">
                    <th className="text-left py-3 px-4">Modelo</th>
                    <th className="text-center py-3 px-4">Total</th>
                    <th className="text-center py-3 px-4">Corretos</th>
                    <th className="text-center py-3 px-4">Incorretos</th>
                    <th className="text-center py-3 px-4">Taxa Acurácia</th>
                  </tr>
                </thead>
                <tbody>
                  {modelStats.map((model) => {
                    const accuracy =
                      model.analyses > 0
                        ? ((model.accurate / model.analyses) * 100).toFixed(2)
                        : "0";
                    return (
                      <tr
                        key={model.name}
                        className="border-b border-blue-400/10 hover:bg-blue-400/5 transition"
                      >
                        <td className="py-3 px-4 font-medium">{model.name}</td>
                        <td className="text-center py-3 px-4">{model.analyses}</td>
                        <td className="text-center py-3 px-4 text-green-400">
                          {model.accurate}
                        </td>
                        <td className="text-center py-3 px-4 text-red-400">
                          {model.inaccurate}
                        </td>
                        <td className="text-center py-3 px-4 font-bold text-blue-400">
                          {accuracy}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="p-6 border-blue-400/20">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">📅 Linha do Tempo</h2>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(224,249,255,0.7)" />
                  <YAxis stroke="rgba(224,249,255,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,10,26,0.9)",
                      border: "1px solid rgba(0,243,255,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="analyses"
                    stroke="#00f3ff"
                    name="Total Análises"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="accurate"
                    stroke="#00ff88"
                    name="Corretos"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="inaccurate"
                    stroke="#ef4444"
                    name="Incorretos"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card className="p-6 border-blue-400/20">
            <h2 className="text-2xl font-bold mb-6 text-blue-400">📋 Detalhes das Análises</h2>
            {analyses.length > 0 ? (
              <div className="space-y-4">
                {analyses.slice(0, 10).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-4 border border-blue-400/20 rounded-lg hover:border-blue-400/50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-400">{analysis.aiModel}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Confiança: {analysis.confidence}% | Tokens: {analysis.tokens}
                    </p>
                    {analysis.isAccurate !== null && (
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          analysis.isAccurate === 1
                            ? "bg-green-400/20 text-green-400"
                            : "bg-red-400/20 text-red-400"
                        }`}
                      >
                        {analysis.isAccurate === 1 ? "✓ Validado" : "✗ Incorreto"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma análise disponível</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
