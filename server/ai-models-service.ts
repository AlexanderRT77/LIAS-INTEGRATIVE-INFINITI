import { getDb } from "./db";
import { cacheModelosIA } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AIModelData {
  nomeModelo: string;
  acuracia: number;
  velocidade: number; // tokens/segundo
  custo: string; // preço por 1M tokens
  categoria: string;
  ranking: number;
  dadosCompletos: any;
}

/**
 * Busca dados de modelos de IA com cache
 * Simula dados de artificialanalysis.ai
 */
export async function getAIModelsData(): Promise<AIModelData[]> {
  const db = await getDb();

  // Verificar cache (atualizar a cada 24 horas)
  if (db) {
    try {
      const cached = await db
        .select()
        .from(cacheModelosIA)
        .limit(100);

      if (cached.length > 0) {
        // Verificar se cache é recente (menos de 24 horas)
        const agora = new Date();
        const ultimaAtualizacao = new Date(cached[0].updatedAt);
        const diffHoras =
          (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);

        if (diffHoras < 24) {
          return cached.map((c) => ({
            nomeModelo: c.nomeModelo,
            acuracia: c.acuracia,
            velocidade: c.velocidade,
            custo: c.custo,
            categoria: c.categoria,
            ranking: c.ranking,
            dadosCompletos: JSON.parse(c.dados),
          }));
        }
      }
    } catch (error) {
      console.error("[AI Models] Erro ao buscar cache:", error);
    }
  }

  // Buscar dados (simulado - em produção viria de artificialanalysis.ai)
  const models = await fetchAIModelsFromSource();

  // Salvar no cache
  if (db && models.length > 0) {
    try {
      for (const model of models) {
        await db
          .insert(cacheModelosIA)
          .values({
            nomeModelo: model.nomeModelo,
            acuracia: model.acuracia,
            velocidade: model.velocidade,
            custo: model.custo,
            categoria: model.categoria,
            ranking: model.ranking,
            dados: JSON.stringify(model.dadosCompletos),
          })
          .onDuplicateKeyUpdate({
            set: {
              acuracia: model.acuracia,
              velocidade: model.velocidade,
              custo: model.custo,
              categoria: model.categoria,
              ranking: model.ranking,
              dados: JSON.stringify(model.dadosCompletos),
              updatedAt: new Date(),
            },
          });
      }
    } catch (error) {
      console.error("[AI Models] Erro ao salvar cache:", error);
    }
  }

  return models;
}

/**
 * Busca dados de modelos de IA (simulado)
 * Em produção, integraria com artificialanalysis.ai
 */
async function fetchAIModelsFromSource(): Promise<AIModelData[]> {
  // Dados simulados baseados em artificialanalysis.ai
  const models: AIModelData[] = [
    {
      nomeModelo: "Claude 3.5 Sonnet",
      acuracia: 95,
      velocidade: 150,
      custo: "$3.00",
      categoria: "Análise Avançada",
      ranking: 1,
      dadosCompletos: {
        provider: "Anthropic",
        releaseDate: "2024-06-20",
        contextWindow: 200000,
        trainingData: "Até Abril 2024",
      },
    },
    {
      nomeModelo: "GPT-4 Turbo",
      acuracia: 92,
      velocidade: 120,
      custo: "$10.00",
      categoria: "Análise Avançada",
      ranking: 2,
      dadosCompletos: {
        provider: "OpenAI",
        releaseDate: "2024-04-09",
        contextWindow: 128000,
        trainingData: "Até Dezembro 2023",
      },
    },
    {
      nomeModelo: "Manus",
      acuracia: 88,
      velocidade: 200,
      custo: "$0.10",
      categoria: "Agente Autônomo",
      ranking: 3,
      dadosCompletos: {
        provider: "Manus Team",
        releaseDate: "2024-01-15",
        contextWindow: 100000,
        trainingData: "Até Março 2024",
      },
    },
    {
      nomeModelo: "DeepSeek R1",
      acuracia: 90,
      velocidade: 180,
      custo: "$0.50",
      categoria: "Raciocínio Lógico",
      ranking: 4,
      dadosCompletos: {
        provider: "DeepSeek",
        releaseDate: "2024-03-10",
        contextWindow: 64000,
        trainingData: "Até Fevereiro 2024",
      },
    },
    {
      nomeModelo: "Perplexity Pro",
      acuracia: 87,
      velocidade: 160,
      custo: "$20.00",
      categoria: "Busca em Tempo Real",
      ranking: 5,
      dadosCompletos: {
        provider: "Perplexity AI",
        releaseDate: "2024-02-01",
        contextWindow: 100000,
        trainingData: "Até Março 2024 + Web Real-Time",
      },
    },
    {
      nomeModelo: "Grok 2",
      acuracia: 85,
      velocidade: 140,
      custo: "$5.00",
      categoria: "Análise de Dados",
      ranking: 6,
      dadosCompletos: {
        provider: "xAI",
        releaseDate: "2024-03-20",
        contextWindow: 128000,
        trainingData: "Até Março 2024",
      },
    },
  ];

  return models;
}

/**
 * Busca modelos por categoria
 */
export async function getModelsByCategory(
  categoria: string
): Promise<AIModelData[]> {
  const allModels = await getAIModelsData();
  return allModels.filter((m) => m.categoria === categoria);
}

/**
 * Ordena modelos por métrica
 */
export function sortModelsByMetric(
  models: AIModelData[],
  metric: "acuracia" | "velocidade" | "custo"
): AIModelData[] {
  const sorted = [...models];

  if (metric === "custo") {
    // Ordenar por custo (menor primeiro)
    sorted.sort((a, b) => {
      const costA = parseFloat(a.custo.replace("$", ""));
      const costB = parseFloat(b.custo.replace("$", ""));
      return costA - costB;
    });
  } else {
    // Ordenar por acurácia ou velocidade (maior primeiro)
    sorted.sort((a, b) => b[metric] - a[metric]);
  }

  return sorted;
}

/**
 * Calcula custo-benefício (acurácia / custo)
 */
export function calculateCostBenefit(
  models: AIModelData[]
): Array<AIModelData & { costBenefit: number }> {
  return models.map((m) => ({
    ...m,
    costBenefit:
      m.acuracia / parseFloat(m.custo.replace("$", "")) || 0,
  }));
}
