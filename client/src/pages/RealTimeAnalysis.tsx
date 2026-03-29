import { useState, useMemo } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Zap, DollarSign, Award } from "lucide-react";

interface AIModel {
  name: string;
  accuracy: number;
  speed: number; // tokens/second
  cost: number; // per 1M tokens
  category: string;
  ranking: number;
}

const MODELS: AIModel[] = [
  {
    name: "Claude 3.5",
    accuracy: 95,
    speed: 150,
    cost: 3.0,
    category: "Análise Avançada",
    ranking: 1,
  },
  {
    name: "GPT-4 Turbo",
    accuracy: 92,
    speed: 120,
    cost: 10.0,
    category: "Análise Avançada",
    ranking: 2,
  },
  {
    name: "Manus",
    accuracy: 88,
    speed: 200,
    cost: 0.1,
    category: "Agente Autônomo",
    ranking: 3,
  },
  {
    name: "DeepSeek R1",
    accuracy: 90,
    speed: 180,
    cost: 0.5,
    category: "Raciocínio Lógico",
    ranking: 4,
  },
  {
    name: "Perplexity",
    accuracy: 87,
    speed: 160,
    cost: 20.0,
    category: "Busca Real-Time",
    ranking: 5,
  },
  {
    name: "Grok 2",
    accuracy: 85,
    speed: 140,
    cost: 5.0,
    category: "Análise de Dados",
    ranking: 6,
  },
];

const COLORS = ["#00f3ff", "#00ff88", "#a855f7", "#ff007f", "#fbbf24", "#60a5fa"];
const CATEGORIES = ["Todas", ...Array.from(new Set(MODELS.map((m) => m.category)))];

export default function RealTimeAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState<"accuracy" | "speed" | "cost">("accuracy");

  const filteredModels = useMemo(() => {
    let filtered =
      selectedCategory === "Todas"
        ? MODELS
        : MODELS.filter((m) => m.category === selectedCategory);

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "cost") {
        return a.cost - b.cost;
      }
      return b[sortBy] - a[sortBy];
    });

    return filtered;
  }, [selectedCategory, sortBy]);

  // Dados para gráfico de custo-benefício
  const costBenefitData = filteredModels.map((m) => ({
    name: m.name,
    accuracy: m.accuracy,
    cost: m.cost,
  }));

  // Dados para gráfico de velocidade vs qualidade
  const speedQualityData = filteredModels.map((m) => ({
    name: m.name,
    speed: m.speed,
    accuracy: m.accuracy,
    cost: m.cost,
  }));

  // Dados para gráfico de barras
  const barData = filteredModels.map((m) => ({
    name: m.name,
    "Acurácia (%)": m.accuracy,
    "Velocidade (tok/s)": m.speed / 10, // Normalizar para visualização
    "Custo ($/1M)": m.cost * 10, // Normalizar para visualização
  }));

  // Dados para pizza
  const categoryDistribution = MODELS.reduce(
    (acc, m) => {
      const existing = acc.find((c) => c.name === m.category);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: m.category, value: 1 });
      }
      return acc;
    },
    [] as Array<{ name: string; value: number }>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg border border-cyan-500/30">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
              Análise em Tempo Real
            </h1>
          </div>
          <p className="text-slate-400">
            Dados comparativos de modelos de IA com atualização em tempo real
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-cyan-500/30">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-cyan-500/30">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-cyan-500/30">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-cyan-500/30">
              <SelectItem value="accuracy">Acurácia</SelectItem>
              <SelectItem value="speed">Velocidade</SelectItem>
              <SelectItem value="cost">Custo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Award,
              label: "Melhor Acurácia",
              value: filteredModels[0]?.name || "-",
              metric: `${filteredModels[0]?.accuracy || 0}%`,
              color: "from-cyan-500/20 to-cyan-600/20",
            },
            {
              icon: Zap,
              label: "Mais Rápido",
              value: filteredModels.sort((a, b) => b.speed - a.speed)[0]?.name || "-",
              metric: `${filteredModels.sort((a, b) => b.speed - a.speed)[0]?.speed || 0} tok/s`,
              color: "from-green-500/20 to-green-600/20",
            },
            {
              icon: DollarSign,
              label: "Mais Econômico",
              value: filteredModels.sort((a, b) => a.cost - b.cost)[0]?.name || "-",
              metric: `$${filteredModels.sort((a, b) => a.cost - b.cost)[0]?.cost || 0}`,
              color: "from-purple-500/20 to-purple-600/20",
            },
            {
              icon: TrendingUp,
              label: "Melhor Custo-Benefício",
              value: filteredModels.sort((a, b) => b.accuracy / b.cost - a.accuracy / a.cost)[0]?.name || "-",
              metric: `${((filteredModels.sort((a, b) => b.accuracy / b.cost - a.accuracy / a.cost)[0]?.accuracy || 0) / (filteredModels.sort((a, b) => b.accuracy / b.cost - a.accuracy / a.cost)[0]?.cost || 1)).toFixed(1)}`,
              color: "from-pink-500/20 to-pink-600/20",
            },
          ].map((card, i) => (
            <Card key={i} className={`bg-gradient-to-br ${card.color} border-slate-700/50`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{card.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{card.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{card.metric}</p>
                  </div>
                  <card.icon className="w-8 h-8 text-cyan-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Comparação de Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  />
                  <Legend />
                  <Bar dataKey="Acurácia (%)" fill="#00f3ff" />
                  <Bar dataKey="Velocidade (tok/s)" fill="#00ff88" />
                  <Bar dataKey="Custo ($/1M)" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scatter Chart */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Velocidade vs Qualidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="speed" name="Velocidade (tok/s)" stroke="#94a3b8" />
                  <YAxis dataKey="accuracy" name="Acurácia (%)" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter name="Modelos" data={speedQualityData} fill="#00f3ff" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Ranking de Acurácia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredModels.map((m) => ({ name: m.name, accuracy: m.accuracy }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#00f3ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-cyan-400">Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-cyan-400">Tabela Detalhada</CardTitle>
            <CardDescription>Dados completos dos modelos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-cyan-400">Modelo</th>
                    <th className="text-left py-3 px-4 text-cyan-400">Categoria</th>
                    <th className="text-center py-3 px-4 text-cyan-400">Acurácia</th>
                    <th className="text-center py-3 px-4 text-cyan-400">Velocidade</th>
                    <th className="text-center py-3 px-4 text-cyan-400">Custo</th>
                    <th className="text-center py-3 px-4 text-cyan-400">Ranking</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-white font-medium">{model.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                          {model.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-green-400">{model.accuracy}%</td>
                      <td className="py-3 px-4 text-center text-cyan-400">{model.speed} tok/s</td>
                      <td className="py-3 px-4 text-center text-purple-400">${model.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-yellow-400">#{model.ranking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
