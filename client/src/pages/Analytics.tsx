import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { trpc } from "@/lib/trpc";

export default function Analytics() {
  const [, navigate] = useLocation();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Buscar dados reais do backend
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  
  const { data: analyticsData = [], isLoading: dataLoading } = trpc.analytics.getData.useQuery({
    days,
  });

  const { data: modelPerformance = [], isLoading: modelLoading } = trpc.analytics.getModelPerformance.useQuery();

  const { data: categoryDistribution = [], isLoading: categoryLoading } = trpc.analytics.getCategoryDistribution.useQuery();

  const { data: stats = { avgLatencia: "0.00", avgCusto: "0.0000", avgConfianca: "0", totalTokens: 0 }, isLoading: statsLoading } = trpc.analytics.getStats.useQuery({
    days,
  });

  // Buscar benchmarks externos
  const { data: benchmarks = [], isLoading: benchmarksLoading } = trpc.comparison.getBenchmarks.useQuery();

  // Buscar ranking de modelos
  const { data: ranking = [], isLoading: rankingLoading } = trpc.comparison.getRanking.useQuery({
    metric: "costEfficiency",
    limit: 10,
  });

  const isLoading = dataLoading || modelLoading || categoryLoading || statsLoading || benchmarksLoading || rankingLoading;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000a1a", color: "#e0f9ff", fontFamily: "'Inter', sans-serif" }}>
      <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/logs")}
            style={{
              background: "rgba(0,243,255,0.1)",
              border: "1px solid rgba(0,243,255,0.3)",
              color: "#00f3ff",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 13,
              marginBottom: 20,
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.15)";
              (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,243,255,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.1)";
              (e.target as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            ◀ Voltar aos Logs
          </button>

          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ background: "rgba(88,28,135,0.5)", color: "#d8b4fe", padding: "4px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #a855f7" }}>
              Análise de Tendências
            </span>
          </div>
          <h1 style={{ color: "#00f3ff", fontSize: 28, fontWeight: 700, margin: "8px 0 4px", fontFamily: "'Courier Prime', monospace", letterSpacing: "0.05em", textShadow: "0 0 20px rgba(0,243,255,0.3)" }}>
            Analytics — LIAS
          </h1>
          <p style={{ color: "rgba(0,243,255,0.7)", marginBottom: 24 }}>
            {isLoading ? "Carregando dados..." : `Visualize tendências de performance dos modelos de IA ao longo do tempo (${analyticsData.length} registros)`}
          </p>
          <hr style={{ borderColor: "rgba(0,243,255,0.15)", marginBottom: 28 }} />
        </div>

        {/* Time Range Selector */}
        <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px", marginBottom: 28, display: "flex", gap: 12 }}>
          <span style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "center" }}>Período:</span>
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                background: timeRange === range ? "rgba(0,243,255,0.3)" : "rgba(0,243,255,0.1)",
                border: `1px solid ${timeRange === range ? "rgba(0,243,255,0.6)" : "rgba(0,243,255,0.2)"}`,
                color: "#00f3ff",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (timeRange !== range) {
                  (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== range) {
                  (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.1)";
                }
              }}
            >
              {range === "7d" ? "Últimos 7 dias" : range === "30d" ? "Últimos 30 dias" : "Últimos 90 dias"}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Latência Média</span>
            <div style={{ color: "#f59e0b", fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stats.avgLatencia}s</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Custo Médio</span>
            <div style={{ color: "#a855f7", fontSize: 28, fontWeight: 700, marginTop: 8 }}>${stats.avgCusto}</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Confiança Média</span>
            <div style={{ color: "#00ff88", fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stats.avgConfianca}%</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Total de Tokens</span>
            <div style={{ color: "#00f3ff", fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stats.totalTokens}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 28, marginBottom: 28 }}>
          {/* Latency Trend */}
          {analyticsData.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Tendência de Latência</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="latencia" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Cost Trend */}
          {analyticsData.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Tendência de Custo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="custo" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Confidence Trend */}
          {analyticsData.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Tendência de Confiança</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="confianca" stroke="#00ff88" strokeWidth={2} dot={{ fill: "#00ff88", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tokens Trend */}
          {analyticsData.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Tendência de Tokens</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,243,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="tokens" fill="#00f3ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Model Performance */}
          {modelPerformance.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Performance por Modelo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={modelPerformance} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {modelPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Distribution */}
          {categoryDistribution.length > 0 && (
            <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Distribuição por Categoria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(0,10,26,0.9)", border: "1px solid rgba(0,243,255,0.3)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* External Benchmarks Comparison */}
          {benchmarks.length > 0 && (
            <div style={{ gridColumn: "1 / -1", background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Benchmarks Externos (artificialanalysis.ai)</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(0,243,255,0.2)" }}>
                      <th style={{ textAlign: "left", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Modelo</th>
                      <th style={{ textAlign: "left", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Provider</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Latência (ms)</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Custo</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Acurácia</th>
                      <th style={{ textAlign: "right", padding: "8px", color: "rgba(0,243,255,0.8)" }}>Eficiência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarks.slice(0, 10).map((benchmark: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(0,243,255,0.1)", background: idx % 2 === 0 ? "rgba(0,243,255,0.02)" : "transparent" }}>
                        <td style={{ padding: "8px", color: "#00f3ff" }}>{benchmark.modelName}</td>
                        <td style={{ padding: "8px", color: "rgba(0,243,255,0.7)" }}>{benchmark.provider}</td>
                        <td style={{ textAlign: "right", padding: "8px", color: "#f59e0b" }}>{benchmark.latency}ms</td>
                        <td style={{ textAlign: "right", padding: "8px", color: "#a855f7" }}>${benchmark.cost.toFixed(4)}</td>
                        <td style={{ textAlign: "right", padding: "8px", color: "#00ff88" }}>{benchmark.accuracy}%</td>
                        <td style={{ textAlign: "right", padding: "8px", color: "#06b6d4" }}>{Math.round(benchmark.costEfficiency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ranking por Eficiência de Custo */}
          {ranking.length > 0 && (
            <div style={{ gridColumn: "1 / -1", background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px" }}>
              <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>🏆 Top Modelos por Eficiência de Custo</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                {ranking.map((model: any, idx: number) => (
                  <div key={idx} style={{ background: "rgba(0,243,255,0.08)", border: "1px solid rgba(0,243,255,0.2)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "#" + (idx + 1)}</div>
                    <div style={{ color: "#00f3ff", fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{model.modelName}</div>
                    <div style={{ color: "rgba(0,243,255,0.6)", fontSize: 11 }}>{model.provider}</div>
                    <div style={{ color: "#06b6d4", fontSize: 13, fontWeight: 700, marginTop: 8 }}>{Math.round(model.costEfficiency)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && analyticsData.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "rgba(0,243,255,0.5)" }}>
              <p>Nenhum dado disponível para o período selecionado.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Crie análises para começar a ver dados aqui.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
