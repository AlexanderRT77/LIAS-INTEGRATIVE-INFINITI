import { getDb } from "./db";
import { analyses, analysisResponses, logs } from "../drizzle/schema";
import { eq, gte, lte, desc } from "drizzle-orm";

export interface AnalyticsDataPoint {
  date: string;
  latencia: number;
  custo: number;
  confianca: number;
  tokens: number;
}

export interface ModelPerformance {
  name: string;
  value: number;
  color: string;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

/**
 * Buscar dados de análises para o período especificado
 */
export async function getAnalyticsData(userId: number, days: number = 7): Promise<AnalyticsDataPoint[]> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Buscar respostas de análises do usuário
  const responses = await db
    .select({
      date: analysisResponses.createdAt,
      processingTime: analysisResponses.processingTime,
      cost: analysisResponses.cost,
      tokens: analysisResponses.tokens,
      rating: analysisResponses.rating,
    })
    .from(analysisResponses)
    .innerJoin(analyses, eq(analysisResponses.analysisId, analyses.id))
    .where(
      gte(analysisResponses.createdAt, startDate)
    )
    .orderBy(desc(analysisResponses.createdAt))
    .limit(100);

  // Agrupar por data
  const groupedByDate = new Map<string, AnalyticsDataPoint>();

  responses.forEach((response: any) => {
    const dateStr = new Date(response.date).toLocaleDateString("pt-BR", {
      month: "2-digit",
      day: "2-digit",
    });

    if (!groupedByDate.has(dateStr)) {
      groupedByDate.set(dateStr, {
        date: dateStr,
        latencia: 0,
        custo: 0,
        confianca: 0,
        tokens: 0,
      });
    }

    const point = groupedByDate.get(dateStr)!;
    point.latencia += (response.processingTime || 0) / 1000; // converter ms para segundos
    point.custo += parseFloat(response.cost || "0");
    point.confianca += (response.rating || 3) / 5; // normalizar rating 1-5 para 0-1
    point.tokens += response.tokens || 0;
  });

  // Calcular médias
  const result = Array.from(groupedByDate.values()).map((point) => {
    const count = responses.filter(
      (r: any) =>
        new Date(r.date).toLocaleDateString("pt-BR", {
          month: "2-digit",
          day: "2-digit",
        }) === point.date
    ).length;

    return {
      date: point.date,
      latencia: parseFloat((point.latencia / count).toFixed(2)),
      custo: parseFloat((point.custo / count).toFixed(4)),
      confianca: parseFloat((point.confianca / count).toFixed(2)),
      tokens: Math.round(point.tokens / count),
    };
  });

  return result.slice(0, 30); // Limitar a 30 dias
}

/**
 * Buscar performance por modelo
 */
export async function getModelPerformance(userId: number): Promise<ModelPerformance[]> {
  const db = await getDb();
  if (!db) return [];

  const responses = await db
    .select({
      aiModel: analysisResponses.aiModel,
      rating: analysisResponses.rating,
    })
    .from(analysisResponses)
    .innerJoin(analyses, eq(analysisResponses.analysisId, analyses.id))
    .limit(200);

  const modelStats = new Map<string, { total: number; sumRating: number }>();

  responses.forEach((response: any) => {
    const model = response.aiModel || "Unknown";
    if (!modelStats.has(model)) {
      modelStats.set(model, { total: 0, sumRating: 0 });
    }
    const stats = modelStats.get(model)!;
    stats.total += 1;
    stats.sumRating += response.rating || 3;
  });

  const colors = [
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#eab308",
    "#ef4444",
    "#1e3a8a",
  ];

  const result: ModelPerformance[] = Array.from(modelStats.entries())
    .map(([name, stats], index) => ({
      name,
      value: Math.round((stats.sumRating / stats.total) * 20), // Converter para percentual
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);

  return result;
}

/**
 * Buscar distribuição por categoria
 */
export async function getCategoryDistribution(userId: number): Promise<CategoryDistribution[]> {
  const db = await getDb();
  if (!db) return [];

  const responses = await db
    .select({
      category: analyses.category,
    })
    .from(analyses)
    .limit(200);

  const categoryStats = new Map<string, number>();

  responses.forEach((response: any) => {
    const category = response.category || "Unknown";
    categoryStats.set(category, (categoryStats.get(category) || 0) + 1);
  });

  const colors = [
    "#00f3ff",
    "#00ff88",
    "#a855f7",
    "#eab308",
    "#ef4444",
    "#1e3a8a",
  ];

  const result: CategoryDistribution[] = Array.from(categoryStats.entries())
    .map(([name, count]: [string, number], index: number) => ({
      name,
      value: count,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);

  return result;
}

/**
 * Buscar estatísticas gerais
 */
export async function getAnalyticsStats(userId: number, days: number = 7) {
  const data = await getAnalyticsData(userId, days);

  if (data.length === 0) {
    return {
      avgLatencia: "0.00",
      avgCusto: "0.0000",
      avgConfianca: "0",
      totalTokens: 0,
    };
  }

  const avgLatencia = (
    data.reduce((sum, d) => sum + d.latencia, 0) / data.length
  ).toFixed(2);
  const avgCusto = (
    data.reduce((sum, d) => sum + d.custo, 0) / data.length
  ).toFixed(4);
  const avgConfianca = Math.round(
    (data.reduce((sum, d) => sum + d.confianca, 0) / data.length) * 100
  ).toString();
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);

  return {
    avgLatencia,
    avgCusto,
    avgConfianca,
    totalTokens,
  };
}
