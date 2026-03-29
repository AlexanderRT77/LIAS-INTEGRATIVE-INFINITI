import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getAnalyticsData,
  getModelPerformance,
  getCategoryDistribution,
  getAnalyticsStats,
} from "./analytics-db";

export const analyticsRouter = router({
  /**
   * Buscar dados de análises para o período especificado
   */
  getData: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getAnalyticsData(ctx.user.id, input.days);
    }),

  /**
   * Buscar performance por modelo
   */
  getModelPerformance: protectedProcedure.query(async ({ ctx }) => {
    return await getModelPerformance(ctx.user.id);
  }),

  /**
   * Buscar distribuição por categoria
   */
  getCategoryDistribution: protectedProcedure.query(async ({ ctx }) => {
    return await getCategoryDistribution(ctx.user.id);
  }),

  /**
   * Buscar estatísticas gerais
   */
  getStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getAnalyticsStats(ctx.user.id, input.days);
    }),
});
