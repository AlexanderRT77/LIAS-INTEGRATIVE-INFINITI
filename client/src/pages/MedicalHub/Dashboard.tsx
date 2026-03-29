import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, TrendingUp, Users, Activity, Award, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function MedicalHubDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const benchmarks = trpc.medicalHub.benchmarks.list.useQuery();
  const validationStats = trpc.medicalHub.validationHistory.getStats.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Faça login para acessar o Medical Hub</p>
        </Card>
      </div>
    );
  }

  const benchmarkData = benchmarks.data || [];
  const stats = validationStats.data;

  // Dados para gráfico de ELO
  const eloData = benchmarkData
    .sort((a, b) => (b.rank || 0) - (a.rank || 0))
    .map((b) => ({
      name: b.aiModel,
      elo: b.elo || 0,
      accuracy: b.diagnosticAccuracy || 0,
    }));

  // Dados para gráfico de acurácia
  const accuracyData = benchmarkData
    .sort((a, b) => (b.diagnosticAccuracy || 0) - (a.diagnosticAccuracy || 0))
    .map((b) => ({
      name: b.aiModel,
      accuracy: b.diagnosticAccuracy || 0,
      falsePositive: b.falsePositiveRate || 0,
      falseNegative: b.falseNegativeRate || 0,
    }));

  const COLORS = ["#00f3ff", "#00ff88", "#ff007f", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-cyan-400">🏥 Medical Hub</h1>
        <p className="text-muted-foreground">
          Análise integrada de parâmetros de saúde e validação de diagnósticos de IA
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 border-cyan-400/30 bg-cyan-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Validações</p>
              <p className="text-3xl font-bold text-cyan-400">{stats?.total || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-cyan-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-green-400/30 bg-green-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Diagnósticos Corretos</p>
              <p className="text-3xl font-bold text-green-400">{stats?.accurate || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-red-400/30 bg-red-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Diagnósticos Incorretos</p>
              <p className="text-3xl font-bold text-red-400">{stats?.inaccurate || 0}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 border-blue-400/30 bg-blue-400/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa de Acurácia</p>
              <p className="text-3xl font-bold text-blue-400">{stats?.accuracyRate}%</p>
            </div>
            <Award className="h-8 w-8 text-blue-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="benchmarks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="ranking">Ranking ELO</TabsTrigger>
          <TabsTrigger value="accuracy">Acurácia</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
        </TabsList>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks">
          <Card className="p-6 border-cyan-400/20">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">📊 Benchmarks das 6 IAs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyan-400/20">
                    <th className="text-left py-3 px-4">Modelo</th>
                    <th className="text-center py-3 px-4">ELO</th>
                    <th className="text-center py-3 px-4">Acurácia</th>
                    <th className="text-center py-3 px-4">Falso Positivo</th>
                    <th className="text-center py-3 px-4">Falso Negativo</th>
                    <th className="text-center py-3 px-4">Taxa Sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkData.map((b, idx) => (
                    <tr
                      key={b.id}
                      className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition"
                    >
                      <td className="py-3 px-4 font-medium">{b.aiModel}</td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-cyan-400/20 text-cyan-400 px-3 py-1 rounded">
                          {b.elo || 0}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-green-400">
                        {b.diagnosticAccuracy?.toFixed(2)}%
                      </td>
                      <td className="text-center py-3 px-4 text-red-400">
                        {b.falsePositiveRate?.toFixed(2)}%
                      </td>
                      <td className="text-center py-3 px-4 text-red-400">
                        {b.falseNegativeRate?.toFixed(2)}%
                      </td>
                      <td className="text-center py-3 px-4 text-blue-400">
                        {b.successRate?.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card className="p-6 border-cyan-400/20">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">🏆 Ranking ELO</h2>
            {eloData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={eloData}>
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
                  <Bar dataKey="elo" fill="#00f3ff" name="ELO Rating" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Accuracy Tab */}
        <TabsContent value="accuracy">
          <Card className="p-6 border-cyan-400/20">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">📈 Taxa de Acurácia</h2>
            {accuracyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={accuracyData}>
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
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#00ff88"
                    name="Acurácia"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="falsePositive"
                    stroke="#ff007f"
                    name="Falso Positivo"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            )}
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card className="p-6 border-cyan-400/20">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">🔬 Análises Recentes</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Nenhuma análise disponível no momento. Comece a adicionar dados de saúde para
                validar diagnósticos de IA.
              </p>
              <Button 
                onClick={() => navigate("/medical-hub/analysis")}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              >
                ➕ Nova Análise
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Cards */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-cyan-400">📚 Módulos do Medical Hub</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 border-cyan-400/20 hover:border-cyan-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">📋 Parâmetros de Saúde</h3>
              <ArrowRight className="h-5 w-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Gerenciar parâmetros de saúde suportados para análise
            </p>
            <Button 
              onClick={() => navigate("/medical-hub/parameters")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>

          <Card className="p-6 border-green-400/20 hover:border-green-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-green-400">🔬 Análise Colaborativa</h3>
              <ArrowRight className="h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Análise de diagnósticos com validação das 6 IAs
            </p>
            <Button 
              onClick={() => navigate("/medical-hub/analysis")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>

          <Card className="p-6 border-pink-400/20 hover:border-pink-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-pink-400">⚖️ Comparação de IAs</h3>
              <ArrowRight className="h-5 w-5 text-pink-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Comparar diagnósticos das 6 IAs lado a lado
            </p>
            <Button 
              onClick={() => navigate("/medical-hub/comparison")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>

          <Card className="p-6 border-blue-400/20 hover:border-blue-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400">📊 Histórico de Logs</h3>
              <ArrowRight className="h-5 w-5 text-blue-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Rastreamento completo de análises e validações
            </p>
            <Button 
              onClick={() => navigate("/medical-hub/logs")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>

          <Card className="p-6 border-orange-400/20 hover:border-orange-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-orange-400">📚 Bibliography</h3>
              <ArrowRight className="h-5 w-5 text-orange-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Buscador bibliográfico integrado com PubMed
            </p>
            <Button 
              onClick={() => navigate("/bibliography")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>

          <Card className="p-6 border-purple-400/20 hover:border-purple-400/50 transition cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-400">📈 Analytics</h3>
              <ArrowRight className="h-5 w-5 text-purple-400 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Analytics avançado com dados em tempo real
            </p>
            <Button 
              onClick={() => navigate("/analytics")}
              variant="outline" 
              className="w-full"
            >
              Acessar
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
