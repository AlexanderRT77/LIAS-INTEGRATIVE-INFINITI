/**
 * Integração com API artificialanalysis.ai
 * Busca dados de benchmark de modelos de IA
 */

export interface AIModelBenchmark {
  modelName: string;
  provider: string;
  latency: number; // em ms
  cost: number; // por 1M tokens
  accuracy: number; // 0-100
  costEfficiency: number; // score 0-100
  speedScore: number; // score 0-100
  reliabilityScore: number; // score 0-100
  lastUpdated: string;
}

export interface BenchmarkComparison {
  internalModel: string;
  externalModel: string;
  internalLatency: number;
  externalLatency: number;
  latencyDifference: number;
  latencyPercentage: number;
  internalCost: number;
  externalCost: number;
  costDifference: number;
  costPercentage: number;
  internalAccuracy: number;
  externalAccuracy: number;
  accuracyDifference: number;
}

// Cache em memória para dados da API
const benchmarkCache = new Map<string, { data: AIModelBenchmark[]; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Buscar dados de benchmark da API artificialanalysis.ai
 */
export async function fetchAIBenchmarks(): Promise<AIModelBenchmark[]> {
  const cacheKey = "ai-benchmarks";
  const cached = benchmarkCache.get(cacheKey);

  // Retornar cache se ainda válido
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch("https://api.artificialanalysis.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("[artificialanalysis.ai] API error:", response.status);
      return getDefaultBenchmarks();
    }

    const data = await response.json();

    // Processar dados da API
    const benchmarks = (data.models || [])
      .slice(0, 20) // Top 20 modelos
      .map((model: any) => ({
        modelName: model.name || model.modelName || "Unknown",
        provider: model.provider || "Unknown",
        latency: model.latency || model.responseTime || 1500,
        cost: model.cost || model.pricePerMillionTokens || 0.01,
        accuracy: model.accuracy || model.benchmarkScore || 75,
        costEfficiency: model.costEfficiency || calculateCostEfficiency(model.cost, model.accuracy),
        speedScore: model.speedScore || calculateSpeedScore(model.latency),
        reliabilityScore: model.reliabilityScore || 85,
        lastUpdated: new Date().toISOString(),
      }));

    // Armazenar em cache
    benchmarkCache.set(cacheKey, { data: benchmarks, timestamp: Date.now() });

    return benchmarks;
  } catch (error) {
    console.error("[artificialanalysis.ai] Error fetching benchmarks:", error);
    return getDefaultBenchmarks();
  }
}

/**
 * Comparar performance interna com benchmark externo
 */
export function comparePerformance(
  internalModel: string,
  internalLatency: number,
  internalCost: number,
  internalAccuracy: number,
  externalBenchmark: AIModelBenchmark
): BenchmarkComparison {
  const latencyDiff = externalBenchmark.latency - internalLatency;
  const costDiff = externalBenchmark.cost - internalCost;
  const accuracyDiff = externalBenchmark.accuracy - internalAccuracy;

  return {
    internalModel,
    externalModel: externalBenchmark.modelName,
    internalLatency,
    externalLatency: externalBenchmark.latency,
    latencyDifference: latencyDiff,
    latencyPercentage: (latencyDiff / externalBenchmark.latency) * 100,
    internalCost,
    externalCost: externalBenchmark.cost,
    costDifference: costDiff,
    costPercentage: (costDiff / externalBenchmark.cost) * 100,
    internalAccuracy,
    externalAccuracy: externalBenchmark.accuracy,
    accuracyDifference: accuracyDiff,
  };
}

/**
 * Buscar modelo similar no benchmark externo
 */
export async function findSimilarModel(modelName: string): Promise<AIModelBenchmark | null> {
  const benchmarks = await fetchAIBenchmarks();
  
  // Buscar por nome exato ou parcial
  const exact = benchmarks.find((b) => b.modelName.toLowerCase() === modelName.toLowerCase());
  if (exact) return exact;

  // Buscar por provider
  const byProvider = benchmarks.find((b) => b.provider.toLowerCase() === modelName.toLowerCase());
  if (byProvider) return byProvider;

  // Buscar por similaridade de nome
  const similar = benchmarks.find((b) =>
    b.modelName.toLowerCase().includes(modelName.toLowerCase()) ||
    modelName.toLowerCase().includes(b.modelName.toLowerCase())
  );

  return similar || null;
}

/**
 * Obter ranking de modelos por métrica
 */
export async function getRanking(metric: "latency" | "cost" | "accuracy" | "costEfficiency" | "speedScore"): Promise<AIModelBenchmark[]> {
  const benchmarks = await fetchAIBenchmarks();

  if (metric === "latency") {
    return benchmarks.sort((a, b) => a.latency - b.latency);
  } else if (metric === "cost") {
    return benchmarks.sort((a, b) => a.cost - b.cost);
  } else if (metric === "accuracy") {
    return benchmarks.sort((a, b) => b.accuracy - a.accuracy);
  } else if (metric === "costEfficiency") {
    return benchmarks.sort((a, b) => b.costEfficiency - a.costEfficiency);
  } else if (metric === "speedScore") {
    return benchmarks.sort((a, b) => b.speedScore - a.speedScore);
  }

  return benchmarks;
}

/**
 * Dados padrão quando API não está disponível
 */
function getDefaultBenchmarks(): AIModelBenchmark[] {
  return [
    {
      modelName: "Claude 3.5 Sonnet",
      provider: "Anthropic",
      latency: 1200,
      cost: 0.003,
      accuracy: 92,
      costEfficiency: 85,
      speedScore: 88,
      reliabilityScore: 95,
      lastUpdated: new Date().toISOString(),
    },
    {
      modelName: "GPT-4 Turbo",
      provider: "OpenAI",
      latency: 1500,
      cost: 0.01,
      accuracy: 90,
      costEfficiency: 75,
      speedScore: 82,
      reliabilityScore: 93,
      lastUpdated: new Date().toISOString(),
    },
    {
      modelName: "DeepSeek R1",
      provider: "DeepSeek",
      latency: 1800,
      cost: 0.0015,
      accuracy: 88,
      costEfficiency: 90,
      speedScore: 78,
      reliabilityScore: 91,
      lastUpdated: new Date().toISOString(),
    },
    {
      modelName: "Gemini 2.0",
      provider: "Google",
      latency: 1400,
      cost: 0.0025,
      accuracy: 89,
      costEfficiency: 88,
      speedScore: 85,
      reliabilityScore: 92,
      lastUpdated: new Date().toISOString(),
    },
    {
      modelName: "Llama 3.1",
      provider: "Meta",
      latency: 2000,
      cost: 0.0008,
      accuracy: 85,
      costEfficiency: 92,
      speedScore: 75,
      reliabilityScore: 88,
      lastUpdated: new Date().toISOString(),
    },
  ];
}

/**
 * Calcular score de eficiência de custo
 */
function calculateCostEfficiency(cost: number, accuracy: number): number {
  if (cost === 0) return 100;
  return Math.min(100, (accuracy / (cost * 1000)) * 10);
}

/**
 * Calcular score de velocidade
 */
function calculateSpeedScore(latency: number): number {
  // Normalizar: 500ms = 100, 5000ms = 10
  return Math.max(10, Math.min(100, 100 - (latency - 500) / 50));
}

/**
 * Limpar cache
 */
export function clearBenchmarkCache(): void {
  benchmarkCache.clear();
}
