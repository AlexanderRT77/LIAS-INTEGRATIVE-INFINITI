"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";

// ─── Log Data Structure ────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: string;
  modelo: string;
  categoria: string;
  prompt: string;
  resposta: string;
  latencia: number;
  tokens: number;
  custo: number;
  status: "sucesso" | "erro" | "timeout";
  confianca: number;
}

// Mock data - em produção, isso viria de uma API
const MOCK_LOGS: LogEntry[] = [
  {
    id: "log-001",
    timestamp: "2026-03-08T10:45:32Z",
    modelo: "Claude 3.5",
    categoria: "Código/Análise",
    prompt: "Explique o padrão de design Factory em TypeScript",
    resposta: "O padrão Factory é um padrão criacional que fornece uma interface para criar objetos sem especificar suas classes concretas. Permite que subclasses decidam qual classe instanciar...",
    latencia: 1.2,
    tokens: 245,
    custo: 0.0049,
    status: "sucesso",
    confianca: 0.98,
  },
  {
    id: "log-002",
    timestamp: "2026-03-08T10:44:15Z",
    modelo: "Manus",
    categoria: "Agente Autônomo",
    prompt: "Crie um plano de ação para otimizar performance",
    resposta: "Plano de otimização: 1) Análise de gargalos 2) Implementação de cache 3) Refatoração de queries 4) Testes de carga...",
    latencia: 2.1,
    tokens: 312,
    custo: 0.0031,
    status: "sucesso",
    confianca: 0.95,
  },
  {
    id: "log-003",
    timestamp: "2026-03-08T10:43:02Z",
    modelo: "DeepSeek R1",
    categoria: "Lógica/Matemática",
    prompt: "Resolva a equação diferencial: dy/dx = 2x",
    resposta: "A solução geral é y = x² + C, onde C é uma constante de integração. Para encontrar C, usamos condições iniciais...",
    latencia: 1.8,
    tokens: 198,
    custo: 0.0024,
    status: "sucesso",
    confianca: 0.99,
  },
  {
    id: "log-004",
    timestamp: "2026-03-08T10:41:45Z",
    modelo: "Perplexidade",
    categoria: "Web Search Real-Time",
    prompt: "Quais são as últimas notícias sobre IA em 2026?",
    resposta: "Segundo fontes recentes, os principais desenvolvimentos incluem: 1) Avanços em modelos multimodais 2) Regulamentação na UE...",
    latencia: 3.5,
    tokens: 421,
    custo: 0.0055,
    status: "sucesso",
    confianca: 0.92,
  },
  {
    id: "log-005",
    timestamp: "2026-03-08T10:40:30Z",
    modelo: "Grok 2",
    categoria: "Dados X/Twitter",
    prompt: "Analise sentimento dos tweets sobre tecnologia",
    resposta: "Análise de 1000 tweets: 65% positivo, 20% neutro, 15% negativo. Principais tópicos: IA, sustentabilidade, inovação...",
    latencia: 2.3,
    tokens: 267,
    custo: 0.0037,
    status: "sucesso",
    confianca: 0.88,
  },
  {
    id: "log-006",
    timestamp: "2026-03-08T10:39:12Z",
    modelo: "Chat.Z.Ai",
    categoria: "Generalista",
    prompt: "Resuma o artigo sobre mudanças climáticas",
    resposta: "O artigo discute o impacto das mudanças climáticas nos ecossistemas globais, destacando: aumento de temperatura, eventos extremos...",
    latencia: 1.9,
    tokens: 289,
    custo: 0.0043,
    status: "sucesso",
    confianca: 0.94,
  },
  {
    id: "log-007",
    timestamp: "2026-03-08T10:38:00Z",
    modelo: "Claude 3.5",
    categoria: "Código/Análise",
    prompt: "Otimize este algoritmo de ordenação",
    resposta: "Recomendo usar Quicksort com particionamento aleatório. Complexidade média O(n log n), pior caso O(n²)...",
    latencia: 1.5,
    tokens: 156,
    custo: 0.0031,
    status: "sucesso",
    confianca: 0.97,
  },
  {
    id: "log-008",
    timestamp: "2026-03-08T10:36:45Z",
    modelo: "Manus",
    categoria: "Agente Autônomo",
    prompt: "Gere relatório de performance",
    resposta: "Relatório gerado com sucesso. Métricas: uptime 99.8%, latência média 1.2s, taxa de erro 0.2%...",
    latencia: 4.2,
    tokens: 534,
    custo: 0.0053,
    status: "sucesso",
    confianca: 0.96,
  },
  {
    id: "log-009",
    timestamp: "2026-03-08T10:35:20Z",
    modelo: "DeepSeek R1",
    categoria: "Lógica/Matemática",
    prompt: "Prove que √2 é irracional",
    resposta: "Prova por contradição: Suponha que √2 = p/q onde p e q são inteiros... [prova completa]",
    latencia: 2.8,
    tokens: 342,
    custo: 0.0041,
    status: "sucesso",
    confianca: 0.99,
  },
  {
    id: "log-010",
    timestamp: "2026-03-08T10:34:00Z",
    modelo: "Perplexidade",
    categoria: "Web Search Real-Time",
    prompt: "Encontre artigos sobre computação quântica",
    resposta: "Encontrados 2.3M resultados. Top 3: [links e resumos de artigos recentes sobre computação quântica]",
    latencia: 5.1,
    tokens: 612,
    custo: 0.0078,
    status: "sucesso",
    confianca: 0.91,
  },
];

const MODEL_COLORS: Record<string, string> = {
  "Manus": "#3b82f6",
  "Claude 3.5": "#22c55e",
  "DeepSeek R1": "#a855f7",
  "Perplexidade": "#eab308",
  "Grok 2": "#ef4444",
  "Chat.Z.Ai": "#1e3a8a",
};

const STATUS_COLORS: Record<string, string> = {
  sucesso: "#00ff88",
  erro: "#f43f5e",
  timeout: "#f59e0b",
};

// ─── Log Entry Card Component ───────────────────────────────────────────

interface LogCardProps {
  log: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}

function LogCard({ log, expanded, onToggle }: LogCardProps) {
  return (
    <div
      style={{
        background: "rgba(0,243,255,0.04)",
        border: "1px solid rgba(0,243,255,0.15)",
        borderRadius: 12,
        padding: "16px",
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 200ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(0,243,255,0.08)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,243,255,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(0,243,255,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,243,255,0.15)";
      }}
      onClick={onToggle}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span
              style={{
                background: MODEL_COLORS[log.modelo],
                color: "#000",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {log.modelo}
            </span>
            <span
              style={{
                background: "rgba(168,85,247,0.2)",
                color: "#d8b4fe",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {log.categoria}
            </span>
            <span
              style={{
                background: STATUS_COLORS[log.status],
                color: log.status === "sucesso" ? "#000" : "#fff",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {log.status.toUpperCase()}
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {log.prompt.substring(0, 100)}...
          </p>
        </div>
        <div style={{ textAlign: "right", marginLeft: 12 }}>
          <p style={{ color: "#00f3ff", fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>
            {log.latencia}s
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>
            {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, paddingTop: 12, borderTop: "1px solid rgba(0,243,255,0.1)" }}>
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Tokens</p>
          <p style={{ color: "#00ff88", fontSize: 13, fontWeight: 700, margin: 0 }}>{log.tokens}</p>
        </div>
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Custo</p>
          <p style={{ color: "#00f3ff", fontSize: 13, fontWeight: 700, margin: 0 }}>${log.custo.toFixed(4)}</p>
        </div>
        <div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Confiança</p>
          <p style={{ color: "#a855f7", fontSize: 13, fontWeight: 700, margin: 0 }}>{(log.confianca * 100).toFixed(0)}%</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.5 }}>Expandir</p>
          <p style={{ color: "#00f3ff", fontSize: 13, fontWeight: 700, margin: 0 }}>{expanded ? "▼" : "▶"}</p>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,243,255,0.1)" }}>
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: "rgba(0,243,255,0.8)", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Prompt</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontFamily: "'Courier Prime', monospace" }}>
              {log.prompt}
            </p>
          </div>
          <div>
            <p style={{ color: "rgba(0,255,136,0.8)", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Resposta</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontFamily: "'Courier Prime', monospace", maxHeight: 200, overflowY: "auto" }}>
              {log.resposta}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export Functions ─────────────────────────────────────────────────────

function exportToJSON(logs: LogEntry[], filename: string = "logs.json") {
  const json = JSON.stringify(logs, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToCSV(logs: LogEntry[], filename: string = "logs.csv") {
  const headers = ["ID", "Data/Hora", "Modelo", "Categoria", "Prompt", "Resposta", "Latência (s)", "Tokens", "Custo ($)", "Status", "Confiança"];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.timestamp).toLocaleString("pt-BR"),
    log.modelo,
    log.categoria,
    `"${log.prompt.replace(/"/g, '""')}"`,
    `"${log.resposta.replace(/"/g, '""')}"`,
    log.latencia,
    log.tokens,
    log.custo.toFixed(4),
    log.status,
    (log.confianca * 100).toFixed(0),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Logs Page Component ───────────────────────────────────────────

export default function Logs() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["Claude 3.5", "Manus", "DeepSeek R1", "Perplexidade", "Grok 2", "Chat.Z.Ai"]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(["sucesso", "erro", "timeout"]);
  const [sortBy, setSortBy] = useState<"recente" | "latencia" | "custo" | "confianca">("recente");

  const toggleModel = useCallback((modelo: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelo) ? prev.filter((m) => m !== modelo) : [...prev, modelo]
    );
  }, []);

  const toggleStatus = useCallback((status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const filteredLogs = useMemo(() => {
    let result = MOCK_LOGS.filter(
      (log) =>
        selectedModels.includes(log.modelo) &&
        selectedStatus.includes(log.status) &&
        (log.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort
    if (sortBy === "recente") {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === "latencia") {
      result.sort((a, b) => b.latencia - a.latencia);
    } else if (sortBy === "custo") {
      result.sort((a, b) => b.custo - a.custo);
    } else if (sortBy === "confianca") {
      result.sort((a, b) => b.confianca - a.confianca);
    }

    return result;
  }, [searchTerm, selectedModels, selectedStatus, sortBy]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const totalTokens = filteredLogs.reduce((sum, log) => sum + log.tokens, 0);
    const totalCusto = filteredLogs.reduce((sum, log) => sum + log.custo, 0);
    const avgLatencia = filteredLogs.length > 0 ? (filteredLogs.reduce((sum, log) => sum + log.latencia, 0) / filteredLogs.length).toFixed(2) : "0";
    const avgConfianca = filteredLogs.length > 0 ? ((filteredLogs.reduce((sum, log) => sum + log.confianca, 0) / filteredLogs.length) * 100).toFixed(0) : "0";

    return { total, totalTokens, totalCusto, avgLatencia, avgConfianca };
  }, [filteredLogs]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000a1a", color: "#e0f9ff", fontFamily: "'Inter', sans-serif" }}>
      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/")}
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
            ◀ Voltar ao Dashboard
          </button>

          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ background: "rgba(88,28,135,0.5)", color: "#d8b4fe", padding: "4px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #a855f7" }}>
              Histórico Completo
            </span>
          </div>
          <h1 style={{ color: "#00f3ff", fontSize: 28, fontWeight: 700, margin: "8px 0 4px", fontFamily: "'Courier Prime', monospace", letterSpacing: "0.05em", textShadow: "0 0 20px rgba(0,243,255,0.3)" }}>
            Log de Interações — LIAS
          </h1>
          <p style={{ color: "rgba(0,243,255,0.7)", marginBottom: 24 }}>
            Visualize todas as interações e respostas dos modelos de IA
          </p>
          <hr style={{ borderColor: "rgba(0,243,255,0.15)", marginBottom: 28 }} />
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Total de Logs</span>
            <div style={{ color: "#00f3ff", fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Total de Tokens</span>
            <div style={{ color: "#00ff88", fontSize: 24, fontWeight: 700 }}>{stats.totalTokens}</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Custo Total</span>
            <div style={{ color: "#a855f7", fontSize: 24, fontWeight: 700 }}>${stats.totalCusto.toFixed(4)}</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Latência Média</span>
            <div style={{ color: "#f59e0b", fontSize: 24, fontWeight: 700 }}>{stats.avgLatencia}s</div>
          </div>
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Confiança Média</span>
            <div style={{ color: "#00ff88", fontSize: 24, fontWeight: 700 }}>{stats.avgConfianca}%</div>
          </div>
        </div>

        {/* Export Section */}
        <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 12, padding: "16px", marginBottom: 28, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: "rgba(0,255,136,0.8)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Exportar Dados:</span>
          <button
            onClick={() => exportToJSON(filteredLogs, `logs-${new Date().toISOString().split('T')[0]}.json`)}
            style={{
              background: "rgba(0,255,136,0.2)",
              border: "1px solid rgba(0,255,136,0.4)",
              color: "#00ff88",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.3)";
              (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,255,136,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.2)";
              (e.target as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            📥 JSON
          </button>
          <button
            onClick={() => exportToCSV(filteredLogs, `logs-${new Date().toISOString().split('T')[0]}.csv`)}
            style={{
              background: "rgba(0,255,136,0.2)",
              border: "1px solid rgba(0,255,136,0.4)",
              color: "#00ff88",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.3)";
              (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,255,136,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.2)";
              (e.target as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            📊 CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px 16px", marginBottom: 28 }}>
          <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Filtros e Busca</h3>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Buscar por prompt, resposta ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0,243,255,0.08)",
                border: "1px solid rgba(0,243,255,0.2)",
                color: "#e0f9ff",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: "none",
                transition: "all 150ms ease",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(0,243,255,0.4)";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 12px rgba(0,243,255,0.2)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(0,243,255,0.2)";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
            />
          </div>

          {/* Model Filter */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "rgba(0,243,255,0.8)", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Modelos</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Claude 3.5", "Manus", "DeepSeek R1", "Perplexidade", "Grok 2", "Chat.Z.Ai"].map((modelo) => (
                <button
                  key={modelo}
                  onClick={() => toggleModel(modelo)}
                  style={{
                    background: selectedModels.includes(modelo) ? MODEL_COLORS[modelo] : "rgba(255,255,255,0.1)",
                    color: selectedModels.includes(modelo) ? "#000" : "rgba(255,255,255,0.6)",
                    border: "1px solid " + (selectedModels.includes(modelo) ? MODEL_COLORS[modelo] : "rgba(255,255,255,0.2)"),
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedModels.includes(modelo)) {
                      (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedModels.includes(modelo)) {
                      (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                    }
                  }}
                >
                  {modelo}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "rgba(0,243,255,0.8)", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["sucesso", "erro", "timeout"].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  style={{
                    background: selectedStatus.includes(status) ? STATUS_COLORS[status] : "rgba(255,255,255,0.1)",
                    color: selectedStatus.includes(status) ? "#000" : "rgba(255,255,255,0.6)",
                    border: "1px solid " + (selectedStatus.includes(status) ? STATUS_COLORS[status] : "rgba(255,255,255,0.2)"),
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    textTransform: "capitalize",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedStatus.includes(status)) {
                      (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedStatus.includes(status)) {
                      (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                    }
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p style={{ color: "rgba(0,243,255,0.8)", fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>Ordenar por</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: "rgba(0,243,255,0.08)",
                border: "1px solid rgba(0,243,255,0.2)",
                color: "#e0f9ff",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="recente">Mais Recente</option>
              <option value="latencia">Maior Latência</option>
              <option value="custo">Maior Custo</option>
              <option value="confianca">Menor Confiança</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div>
          <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>
            Registros ({filteredLogs.length})
          </h3>
          {filteredLogs.length === 0 ? (
            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 8, padding: "16px", color: "#fbbf24", textAlign: "center" }}>
              Nenhum log encontrado com os filtros selecionados.
            </div>
          ) : (
            <div>
              {filteredLogs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
