import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateComparisonPDF, exportToCSV, exportToJSON } from "./pdf-export";

// Schema para dados de comparação
const AIModelSchema = z.object({
  name: z.string(),
  acuracia: z.number().min(0).max(10),
  coerencia: z.number().min(0).max(10),
  profundidade: z.number().min(0).max(10),
  velocidade: z.number().positive(),
  custo: z.number().positive(),
  seguranca: z.number().min(0).max(10),
});

const RecommendationSchema = z.object({
  bestQuality: z.object({ name: z.string(), score: z.number() }),
  bestCostBenefit: z.object({ name: z.string(), ratio: z.number() }),
  fastest: z.object({ name: z.string(), speed: z.number() }),
  mostEconomical: z.object({ name: z.string(), cost: z.number() }),
});

export const exportRouter = router({
  /**
   * Exporta relatório de comparação para PDF
   */
  exportPDF: protectedProcedure
    .input(
      z.object({
        models: z.array(AIModelSchema),
        selectedModels: z.array(z.string()),
        recommendations: RecommendationSchema,
        chartImages: z
          .object({
            costBenefit: z.string().optional(),
            speedQuality: z.string().optional(),
            radar: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const comparisonData = {
          models: input.models,
          selectedModels: input.selectedModels,
          timestamp: new Date(),
          generatedBy: ctx.user?.name || "Sistema LIAS",
        };

        const pdfBuffer = await generateComparisonPDF(
          comparisonData,
          input.recommendations,
          input.chartImages
        );

        return {
          success: true,
          data: pdfBuffer.toString("base64"),
          filename: `comparacao-ias-${new Date().getTime()}.pdf`,
        };
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        throw new Error("Falha ao gerar relatório PDF");
      }
    }),

  /**
   * Exporta dados de comparação para CSV
   */
  exportCSV: protectedProcedure
    .input(
      z.object({
        models: z.array(AIModelSchema),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportToCSV(input.models);

        return {
          success: true,
          data: csv,
          filename: `comparacao-ias-${new Date().getTime()}.csv`,
        };
      } catch (error) {
        console.error("Erro ao gerar CSV:", error);
        throw new Error("Falha ao gerar arquivo CSV");
      }
    }),

  /**
   * Exporta dados de comparação para JSON
   */
  exportJSON: protectedProcedure
    .input(
      z.object({
        models: z.array(AIModelSchema),
        selectedModels: z.array(z.string()),
        recommendations: RecommendationSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const comparisonData = {
          models: input.models,
          selectedModels: input.selectedModels,
          timestamp: new Date(),
          generatedBy: ctx.user?.name || "Sistema LIAS",
        };

        const json = exportToJSON(comparisonData, input.recommendations);

        return {
          success: true,
          data: json,
          filename: `comparacao-ias-${new Date().getTime()}.json`,
        };
      } catch (error) {
        console.error("Erro ao gerar JSON:", error);
        throw new Error("Falha ao gerar arquivo JSON");
      }
    }),
});
