import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  fetchAIBenchmarks,
  comparePerformance,
  findSimilarModel,
  getRanking,
  clearBenchmarkCache,
} from "./artificial-analysis";

export const comparisonRouter = router({
  /**
   * Buscar benchmarks de modelos de IA
   */
  getBenchmarks: protectedProcedure.query(async () => {
    return await fetchAIBenchmarks();
  }),

  /**
   * Comparar modelo interno com benchmark externo
   */
  compareModel: protectedProcedure
    .input(
      z.object({
        modelName: z.string(),
        latency: z.number(),
        cost: z.number(),
        accuracy: z.number(),
      })
    )
    .query(async ({ input }) => {
      const externalModel = await findSimilarModel(input.modelName);
      
      if (!externalModel) {
        return null;
      }

      return comparePerformance(
        input.modelName,
        input.latency,
        input.cost,
        input.accuracy,
        externalModel
      );
    }),

  /**
   * Buscar modelo similar no benchmark externo
   */
  findSimilarModel: protectedProcedure
    .input(z.object({ modelName: z.string() }))
    .query(async ({ input }) => {
      return await findSimilarModel(input.modelName);
    }),

  /**
   * Obter ranking de modelos por métrica
   */
  getRanking: protectedProcedure
    .input(
      z.object({
        metric: z.enum(["latency", "cost", "accuracy", "costEfficiency", "speedScore"]),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const ranking = await getRanking(input.metric);
      return ranking.slice(0, input.limit);
    }),

  /**
   * Limpar cache de benchmarks
   */
  clearCache: protectedProcedure.mutation(async ({ ctx }) => {
    // Apenas admin pode limpar cache
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    clearBenchmarkCache();
    return { success: true };
  }),
});
