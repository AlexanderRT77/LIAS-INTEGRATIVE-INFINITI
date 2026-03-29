"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Data Structure ────────────────────────────────────────────────────────

interface ModelData {
  Modelo: string;
  Acurácia: number;
  Coerência: number;
  Profundidade: number;
  Velocidade: number;
  Custo: number;
  Segurança: number;
  Foco: string;
}

const DADOS: ModelData[] = [
  { Modelo: "Manus", Acurácia: 9, Coerência: 8, Profundidade: 7, Velocidade: 2.5, Custo: 0.10, Segurança: 9, Foco: "Agente Autônomo" },
  { Modelo: "Claude 3.5", Acurácia: 10, Coerência: 9, Profundidade: 8, Velocidade: 1.5, Custo: 0.15, Segurança: 8, Foco: "Código/Análise" },
  { Modelo: "DeepSeek R1", Acurácia: 9, Coerência: 7, Profundidade: 6, Velocidade: 2.0, Custo: 0.12, Segurança: 9, Foco: "Lógica/Matemática" },
  { Modelo: "Perplexidade", Acurácia: 8, Coerência: 6, Profundidade: 5, Velocidade: 1.8, Custo: 0.11, Segurança: 7, Foco: "Web Search Real-Time" },
  { Modelo: "Grok 2", Acurácia: 7, Coerência: 5, Profundidade: 4, Velocidade: 1.6, Custo: 0.14, Segurança: 6, Foco: "Dados X/Twitter" },
  { Modelo: "Chat.Z.Ai", Acurácia: 8, Coerência: 7, Profundidade: 6, Velocidade: 2.2, Custo: 0.13, Segurança: 8, Foco: "Generalista" },
];

const ALL_FOCOS = Array.from(new Set(DADOS.map((d) => d.Foco)));

// ─── Model Logo Map ───────────────────────────────────────────────────────

const MODEL_LOGOS: Record<string, string> = {
  "Manus": "https://img.icons8.com/color/96/000000/artificial-intelligence.png",
  "Claude 3.5": "https://img.icons8.com/color/96/000000/brain.png",
  "DeepSeek R1": "https://img.icons8.com/color/96/000000/network.png",
  "Perplexidade": "https://img.icons8.com/color/96/000000/search.png",
  "Grok 2": "https://img.icons8.com/color/96/000000/lightning-bolt.png",
  "Chat.Z.Ai": "https://img.icons8.com/color/96/000000/chat.png",
};

function ModelLogo({ name, size = 16 }: { name: string; size?: number }) {
  const src = MODEL_LOGOS[name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        borderRadius: 3,
        flexShrink: 0,
        filter: "drop-shadow(0 0 4px rgba(0, 243, 255, 0.6))",
      }}
    />
  );
}

function ModelName({ name, size = 14 }: { name: string; size?: number }) {
  const hasLogo = Boolean(MODEL_LOGOS[name]);
  if (hasLogo) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <ModelLogo name={name} size={size} />
        {name}
      </span>
    );
  }
  return <>{name}</>;
}

// ─── Color Palette ───────────────────────────────────────────────────────

const RADAR_COLORS = ["#00f3ff", "#00ff88", "#a855f7", "#f59e0b", "#f43f5e", "#3b82f6"];

const MODEL_COLORS: Record<string, string> = {
  "Manus": "#3b82f6",
  "Claude 3.5": "#22c55e",
  "DeepSeek R1": "#a855f7",
  "Perplexidade": "#eab308",
  "Grok 2": "#ef4444",
  "Chat.Z.Ai": "#1e3a8a",
};

// ─── CSV Export ───────────────────────────────────────────────────────

function exportarCSV(rows: ModelData[]) {
  const headers = ["Modelo", "Acurácia", "Coerência", "Profundidade", "Velocidade", "Custo", "Segurança", "Foco"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.Modelo, r.Acurácia, r.Coerência, r.Profundidade, r.Velocidade, r.Custo, r.Segurança, `"${r.Foco}"`].join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "metricas_lias_filtrado.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 3D Math Helpers ───────────────────────────────────────────────────────

type Vec3 = [number, number, number];

function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0], v[1] * cos - v[2] * sin, v[1] * sin + v[2] * cos];
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos];
}

function project(v: Vec3, fov: number, cx: number, cy: number): [number, number, number] {
  const z = v[2] + fov;
  const scale = fov / z;
  return [v[0] * scale + cx, v[1] * scale + cy, scale];
}

// ─── 3D Radar Chart ───────────────────────────────────────────────────────

const AXES = ["Acurácia", "Coerência", "Profundidade"] as const;
type AxisKey = typeof AXES[number];

interface Radar3DProps {
  modelos: ModelData[];
  cores: string[];
  width?: number;
  height?: number;
}

interface TooltipInfo {
  x: number;
  y: number;
  modelo: string;
  valores: Record<AxisKey, number>;
  cor: string;
}

function Radar3D({ modelos, cores, width = 420, height = 340 }: Radar3DProps) {
  const [rotX, setRotX] = useState(-0.45);
  const [rotY, setRotY] = useState(0.3);
  const [dragging, setDragging] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const lastMouse = useRef<{ x: number; y: number } | null>(null);
  const animRef = useRef<number | null>(null);
  const rotYRef = useRef(rotY);
  const draggingRef = useRef(false);

  useEffect(() => { rotYRef.current = rotY; }, [rotY]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);

  useEffect(() => {
    const tick = () => {
      if (!draggingRef.current) {
        setRotY((prev) => prev + 0.004);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !lastMouse.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setRotY((prev) => prev + dx * 0.01);
      setRotX((prev) => Math.max(-1.2, Math.min(0.2, prev + dy * 0.01)));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    },
    [dragging]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
    lastMouse.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true);
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging || !lastMouse.current) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      setRotY((prev) => prev + dx * 0.01);
      setRotX((prev) => Math.max(-1.2, Math.min(0.2, prev + dy * 0.01)));
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    [dragging]
  );

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    lastMouse.current = null;
  }, []);

  const cx = width / 2;
  const cy = height / 2 + 10;
  const fov = 380;
  const maxR = Math.min(width, height) * 0.36;

  const axisAngles = AXES.map((_, i) => (i / AXES.length) * Math.PI * 2 - Math.PI / 2);
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const transform = (v: Vec3): [number, number, number] => {
    let p = rotateX(v, rotX);
    p = rotateY(p, rotY);
    return project(p, fov, cx, cy);
  };

  const ringPolygons = rings.map((r) => {
    const pts = AXES.map((_, i) => {
      const angle = axisAngles[i];
      const v: Vec3 = [Math.cos(angle) * r * maxR, 0, Math.sin(angle) * r * maxR];
      return transform(v);
    });
    return pts;
  });

  const axisLines = AXES.map((_, i) => {
    const angle = axisAngles[i];
    const tip: Vec3 = [Math.cos(angle) * maxR, 0, Math.sin(angle) * maxR];
    const center: Vec3 = [0, 0, 0];
    return { from: transform(center), to: transform(tip), label: AXES[i] };
  });

  const modelPolygons = modelos.map((modelo, mi) => {
    const pts = AXES.map((axis, i) => {
      const val = ((modelo[axis as AxisKey] as number) / 10);
      const angle = axisAngles[i];
      const v: Vec3 = [Math.cos(angle) * val * maxR, 0, Math.sin(angle) * val * maxR];
      return transform(v);
    });
    return { pts, modelo, cor: cores[mi % cores.length] };
  });

  const pillars = modelos.map((modelo, mi) => {
    const color = cores[mi % cores.length];
    return AXES.map((axis, i) => {
      const val = ((modelo[axis as AxisKey] as number) / 10);
      const angle = axisAngles[i];
      const top: Vec3 = [Math.cos(angle) * val * maxR, 0, Math.sin(angle) * val * maxR];
      const bottom: Vec3 = [Math.cos(angle) * val * maxR, 30, Math.sin(angle) * val * maxR];
      return { top: transform(top), bottom: transform(bottom), color };
    });
  });

  const sortedModels = [...modelPolygons].sort((a, b) => {
    const avgA = a.pts.reduce((s, p) => s + p[2], 0) / a.pts.length;
    const avgB = b.pts.reduce((s, p) => s + p[2], 0) / b.pts.length;
    return avgA - avgB;
  });

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      <svg
        width={width}
        height={height}
        style={{ cursor: dragging ? "grabbing" : "grab", display: "block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {ringPolygons.map((pts, ri) => (
          <polygon
            key={`ring-${ri}`}
            points={pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
            fill="none"
            stroke={ri === rings.length - 1 ? "rgba(0,243,255,0.35)" : "rgba(0,243,255,0.12)"}
            strokeWidth={ri === rings.length - 1 ? 1.5 : 0.8}
            opacity={0.6}
          />
        ))}

        {axisLines.map((line, i) => (
          <g key={`axis-${i}`}>
            <line
              x1={line.from[0]}
              y1={line.from[1]}
              x2={line.to[0]}
              y2={line.to[1]}
              stroke="rgba(0,243,255,0.4)"
              strokeWidth={1.5}
              opacity={0.8}
            />
            <text
              x={line.to[0] * 1.15}
              y={line.to[1] * 1.15}
              fill="#00f3ff"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ textShadow: "0 0 8px rgba(0,243,255,0.6)" }}
            >
              {line.label}
            </text>
          </g>
        ))}

        {pillars.map((modelPillars, mi) =>
          modelPillars.map((pillar, pi) => (
            <line
              key={`pillar-${mi}-${pi}`}
              x1={pillar.top[0]}
              y1={pillar.top[1]}
              x2={pillar.bottom[0]}
              y2={pillar.bottom[1]}
              stroke={pillar.color}
              strokeWidth={2}
              opacity={0.3}
            />
          ))
        )}

        {sortedModels.map((modelPoly, mi) => (
          <g key={`model-${modelPoly.modelo.Modelo}`}>
            <polygon
              points={modelPoly.pts.map((p) => `${p[0]},${p[1]}`).join(" ")}
              fill={modelPoly.cor}
              fillOpacity={0.15}
              stroke={modelPoly.cor}
              strokeWidth={2}
              style={{
                filter: `drop-shadow(0 0 8px ${modelPoly.cor}88)`,
                transition: "all 200ms ease",
              }}
              onMouseEnter={() => {
                const avgX = modelPoly.pts.reduce((s, p) => s + p[0], 0) / modelPoly.pts.length;
                const avgY = modelPoly.pts.reduce((s, p) => s + p[1], 0) / modelPoly.pts.length;
                setTooltip({
                  x: avgX,
                  y: avgY,
                  modelo: modelPoly.modelo.Modelo,
                  valores: {
                    Acurácia: modelPoly.modelo.Acurácia,
                    Coerência: modelPoly.modelo.Coerência,
                    Profundidade: modelPoly.modelo.Profundidade,
                  },
                  cor: modelPoly.cor,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          </g>
        ))}

        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 80}
              y={tooltip.y - 60}
              width="160"
              height="55"
              fill="rgba(5,10,21,0.95)"
              stroke={tooltip.cor}
              strokeWidth="1.5"
              rx="6"
              style={{ filter: `drop-shadow(0 0 12px ${tooltip.cor}66)` }}
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 38}
              fill={tooltip.cor}
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
            >
              {tooltip.modelo}
            </text>
            <text
              x={tooltip.x}
              y={tooltip.y - 20}
              fill="rgba(255,255,255,0.8)"
              fontSize="10"
              textAnchor="middle"
            >
              Acurácia: {tooltip.valores.Acurácia}/10
            </text>
            <text
              x={tooltip.x}
              y={tooltip.y - 8}
              fill="rgba(255,255,255,0.8)"
              fontSize="10"
              textAnchor="middle"
            >
              Coerência: {tooltip.valores.Coerência}/10
            </text>
            <text
              x={tooltip.x}
              y={tooltip.y + 4}
              fill="rgba(255,255,255,0.8)"
              fontSize="10"
              textAnchor="middle"
            >
              Profundidade: {tooltip.valores.Profundidade}/10
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Metric Card Component ───────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div
      style={{
        background: "rgba(0,243,255,0.04)",
        border: "1px solid rgba(0,243,255,0.15)",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ color: "#00f3ff", fontSize: 18, fontWeight: 700 }}>
        {value}
      </div>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
        {sub}
      </span>
    </div>
  );
}

// ─── Main Dashboard Component ───────────────────────────────────────────

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFocos, setSelectedFocos] = useState<string[]>(ALL_FOCOS);

  const toggleFoco = useCallback((foco: string) => {
    setSelectedFocos((prev) =>
      prev.includes(foco) ? prev.filter((f) => f !== foco) : [...prev, foco]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFocos(ALL_FOCOS);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFocos([]);
  }, []);

  const filtered = useMemo(
    () => DADOS.filter((d) => selectedFocos.includes(d.Foco)),
    [selectedFocos]
  );

  const bestAcuracia = useMemo(() => {
    return filtered.length > 0 ? filtered.reduce((a, b) => (a.Acurácia > b.Acurácia ? a : b)) : null;
  }, [filtered]);

  const bestCoerencia = useMemo(() => {
    return filtered.length > 0 ? filtered.reduce((a, b) => (a.Coerência > b.Coerência ? a : b)) : null;
  }, [filtered]);

  const bestProfundidade = useMemo(() => {
    return filtered.length > 0 ? filtered.reduce((a, b) => (a.Profundidade > b.Profundidade ? a : b)) : null;
  }, [filtered]);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000a1a", color: "#e0f9ff", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 272 : 0,
          overflow: "hidden",
          transition: "width 0.3s ease",
          background: "linear-gradient(180deg, rgba(0,10,25,0.95) 0%, rgba(0,5,15,0.98) 100%)",
          borderRight: "1px solid rgba(0,243,255,0.12)",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "28px 20px", minWidth: 272 }}>
          <div
            style={{
              background: "linear-gradient(135deg, rgba(0,243,255,0.12) 0%, rgba(0,255,136,0.06) 100%)",
              border: "1px solid rgba(0,243,255,0.3)",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
              marginBottom: 28,
              color: "#00f3ff",
              fontWeight: 700,
              letterSpacing: 3,
              fontSize: 13,
              textShadow: "0 0 12px rgba(0,243,255,0.5)",
            }}
          >
            Análise LIAS
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(0,243,255,0.6))" }}>
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#00f3ff" fillOpacity="0.9" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#00f3ff" fillOpacity="0.55" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#00f3ff" fillOpacity="0.55" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#00ff88" fillOpacity="0.75" />
              </svg>
              <p style={{ color: "#00f3ff", fontWeight: 700, margin: 0, fontSize: 17, letterSpacing: 0.4, textShadow: "0 0 10px rgba(0,243,255,0.4)" }}>
                Painel de Controle
              </p>
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, lineHeight: 1.5 }}>
              Filtre os modelos dinamicamente para análise dirigida.
            </p>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,243,255,0.1)", marginBottom: 20 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: "rgba(0,243,255,0.85)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Foco de IA
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={selectAll} style={{ background: "transparent", border: "1px solid rgba(0,243,255,0.25)", color: "rgba(0,243,255,0.6)", borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer", transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#00f3ff"; (e.target as HTMLButtonElement).style.borderColor = "#00f3ff"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "rgba(0,243,255,0.6)"; (e.target as HTMLButtonElement).style.borderColor = "rgba(0,243,255,0.25)"; }}>
                Todos
              </button>
              <button onClick={clearAll} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.35)", borderRadius: 4, padding: "2px 8px", fontSize: 10, cursor: "pointer", transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#f43f5e"; (e.target as HTMLButtonElement).style.borderColor = "#f43f5e"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}>
                Limpar
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ALL_FOCOS.map((foco) => {
              const active = selectedFocos.includes(foco);
              return (
                <button
                  key={foco}
                  onClick={() => toggleFoco(foco)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    background: active ? "rgba(0,243,255,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${active ? "rgba(0,243,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 8,
                    padding: "9px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,243,255,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,243,255,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                    }
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#00f3ff" : "rgba(255,255,255,0.15)", boxShadow: active ? "0 0 6px rgba(0,243,255,0.8)" : "none", transition: "all 150ms ease" }} />
                  <span style={{ fontSize: 12, color: active ? "#e0f9ff" : "rgba(255,255,255,0.35)", flex: 1 }}>{foco}</span>
                  {active && <span style={{ color: "#00f3ff", fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.12)", borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Modelos visíveis</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: filtered.length > 0 ? "#00f3ff" : "rgba(255,100,100,0.8)" }}>
              {filtered.length} / {DADOS.length}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 28px", overflowX: "hidden", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSidebarOpen((v) => !v)} style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,243,255,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            {sidebarOpen ? "◀ Fechar Painel" : "▶ Abrir Painel"}
          </button>
          <button onClick={() => window.location.href = "/logs"} style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,255,136,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📋 Ver Logs
          </button>
          <button onClick={() => window.location.href = "/analytics"} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#d8b4fe", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(168,85,247,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(168,85,247,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(168,85,247,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📊 Analytics
          </button>
          <button onClick={() => window.location.href = "/analysis"} style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.3)", color: "#00f3ff", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,243,255,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            🔬 Análise Colaborativa
          </button>
          <button onClick={() => window.location.href = "/comparison"} style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,255,136,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,255,136,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📊 Comparação Visual
          </button>
          <button onClick={() => window.location.href = "/bibliography"} style={{ background: "rgba(255,0,127,0.1)", border: "1px solid rgba(255,0,127,0.3)", color: "#ff007f", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255,0,127,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(255,0,127,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255,0,127,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📚 Buscador Bibliográfico
          </button>
          <button onClick={() => window.location.href = "/real-time-analysis"} style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#d8b4fe", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(168,85,247,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(168,85,247,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(168,85,247,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📈 Análise em Tempo Real
          </button>
          <button onClick={() => window.location.href = "/personalized"} style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", color: "#f472b6", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(236,72,153,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(236,72,153,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(236,72,153,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            ⚙️ Meu Dashboard
          </button>
          <button onClick={() => window.location.href = "/scheduled-reports"} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(34,197,94,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(34,197,94,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(34,197,94,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📅 Relatórios Agendados
          </button>
          <button onClick={() => window.location.href = "/analytics-reports"} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(59,130,246,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(59,130,246,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(59,130,246,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>
            📊 Relatórios Analytics
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ background: "rgba(88,28,135,0.5)", color: "#d8b4fe", padding: "4px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #a855f7" }}>
            Abordagem Acadêmica
          </span>
        </div>
        <h1 style={{ color: "#00f3ff", fontSize: 28, fontWeight: 700, margin: "8px 0 4px", fontFamily: "'Courier Prime', monospace", letterSpacing: "0.05em", textShadow: "0 0 20px rgba(0,243,255,0.3)" }}>Dashboard Analítico — LIAS</h1>
        <p style={{ color: "rgba(0,243,255,0.7)", marginBottom: 24 }}>Estratégias Avançadas para Estudos em Medicina</p>
        <hr style={{ borderColor: "rgba(0,243,255,0.15)", marginBottom: 28 }} />

        {filtered.length === 0 ? (
          <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 8, padding: "12px 16px", color: "#fbbf24", marginBottom: 28 }}>
            ⚠️ Selecione ao menos uma categoria de Foco no painel lateral.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
            <MetricCard label="Melhor Acurácia" value={<ModelName name={bestAcuracia?.Modelo ?? "—"} size={20} />} sub={`${bestAcuracia?.Acurácia ?? "—"} pts`} />
            <MetricCard label="Melhor Coerência" value={<ModelName name={bestCoerencia?.Modelo ?? "—"} size={20} />} sub={`${bestCoerencia?.Coerência ?? "—"} pts`} />
            <MetricCard label="Melhor Profundidade" value={<ModelName name={bestProfundidade?.Modelo ?? "—"} size={20} />} sub={`${bestProfundidade?.Profundidade ?? "—"} pts`} />
          </div>
        )}

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 28 }}>
          {/* 3D Radar Chart */}
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ color: "#00f3ff", marginBottom: 4, fontSize: 15, alignSelf: "flex-start", fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Radar 3D — Acurácia · Coerência · Profundidade</h3>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 16, alignSelf: "flex-start" }}>Comparativo interativo entre modelos</p>
            {filtered.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "40px 0" }}>Nenhum modelo selecionado</p>
            ) : (
              <>
                <Radar3D modelos={filtered} cores={RADAR_COLORS} width={420} height={320} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 8, justifyContent: "center" }}>
                  {filtered.map((m, i) => (
                    <div key={m.Modelo} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: RADAR_COLORS[i % RADAR_COLORS.length], boxShadow: `0 0 6px ${RADAR_COLORS[i % RADAR_COLORS.length]}88` }} />
                      <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}><ModelName name={m.Modelo} size={12} /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cost Line Chart */}
          <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px 16px" }}>
            <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>Custo por Requisição ($)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filtered} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="Modelo" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.2)" }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.2)" }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload as ModelData;
                    const color = MODEL_COLORS[data?.Modelo] || "#fff";
                    return (
                      <div style={{ background: "rgba(5,10,21,0.95)", border: `1px solid ${color}`, borderRadius: 8, padding: "10px 14px", boxShadow: `0 0 16px ${color}44` }}>
                        <p style={{ color, fontWeight: 700, margin: "0 0 6px", fontSize: 13 }}><ModelName name={label as string} size={14} /></p>
                        <p style={{ color: "#fff", fontWeight: 600, fontSize: 12, margin: 0 }}>${(data?.Custo ?? 0).toFixed(2)}</p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} formatter={(value) => (
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}><ModelName name={value as string} size={12} /></span>
                )} />
                {filtered.map((modelo) => (
                  <Line key={modelo.Modelo} type="monotone" dataKey="Custo" data={[modelo]} stroke={MODEL_COLORS[modelo.Modelo] || "#fff"} strokeWidth={2} dot={{ r: 6, fill: MODEL_COLORS[modelo.Modelo] || "#fff", stroke: "#050a15", strokeWidth: 2 }} activeDot={{ r: 8, fill: MODEL_COLORS[modelo.Modelo] || "#fff", stroke: "#fff", strokeWidth: 2 }} name={modelo.Modelo} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div style={{ background: "rgba(0,243,255,0.04)", border: "1px solid rgba(0,243,255,0.15)", borderRadius: 12, padding: "20px 16px" }}>
          <h3 style={{ color: "#00f3ff", marginBottom: 16, fontSize: 15, fontFamily: "'Courier Prime', monospace", fontWeight: 700 }}>
            Métricas Detalhadas <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400, fontSize: 13 }}>(Destaque: Segurança ≥ 9)</span>
          </h3>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => exportarCSV(filtered)} style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.4)", color: "#00f3ff", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 13, transition: "all 150ms ease" }} onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.15)"; (e.target as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(0,243,255,0.4)"; }} onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,243,255,0.1)"; (e.target as HTMLButtonElement).style.boxShadow = "none"; }}>📄 Baixar em CSV</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Modelo", "Acurácia", "Coerência", "Profundidade", "Velocidade", "Custo ($)", "Segurança", "Foco"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(0,243,255,0.8)", borderBottom: "1px solid rgba(0,243,255,0.2)", whiteSpace: "nowrap", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const highlight = row.Segurança >= 9;
                  return (
                    <tr key={row.Modelo} style={{ background: highlight ? "rgba(0,255,136,0.08)" : "transparent" }}>
                      <td style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: highlight ? "#00ff88" : "rgba(255,255,255,0.85)", fontWeight: highlight ? 700 : 400 }}><ModelName name={row.Modelo} size={15} /></td>
                      {[
                        row.Acurácia,
                        row.Coerência,
                        row.Profundidade,
                        row.Velocidade,
                        `$${row.Custo.toFixed(2)}`,
                        row.Segurança,
                        row.Foco,
                      ].map((val, ci) => (
                        <td key={ci} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: highlight ? "#00ff88" : "rgba(255,255,255,0.85)" }}>{val}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
