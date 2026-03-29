import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  invokeMedicalLLM,
  invokeAllModels,
  calculateConsensus,
  validateDiagnosis,
} from "../services/llm-integration";
import { db } from "../db";
import { healthAnalyses } from "../../drizzle/schema";

export const llmAnalysisRouter = router({
  /**
   * Analyze with single AI model
   */
  analyzeSingle: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10),
        model: z.enum(["claude", "gpt4", "gemini", "deepseek", "perplexity", "grok"]),
        healthData: z.record(z.any()).optional(),
        temperature: z.number().min(0).max(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const analysis = await invokeMedicalLLM({
          prompt: input.prompt,
          model: input.model,
          healthData: input.healthData,
          temperature: input.temperature,
        });

        // Store in database
        await db.insert(healthAnalyses).values({
          userId: ctx.user.id,
          analysisId: 0, // Will be set by the analysis system
          healthDataId: 0, // Will be set by the analysis system
          aiModel: input.model,
          diagnosis: analysis.diagnosis,
          confidence: analysis.confidence,
          recommendations: analysis.recommendations,
          processingTime: analysis.processingTime,
          cost: analysis.cost,
          tokens: analysis.tokensUsed,
        });

        return analysis;
      } catch (error) {
        console.error("LLM Analysis Error:", error);
        throw new Error("Failed to perform analysis");
      }
    }),

  /**
   * Analyze with all 6 AI models
   */
  analyzeAll: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10),
        healthData: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const analyses = await invokeAllModels({
          prompt: input.prompt,
          healthData: input.healthData,
        });

        // Store all analyses
        for (const analysis of analyses) {
          await db.insert(healthAnalyses).values({
            userId: ctx.user.id,
            analysisId: 0,
            healthDataId: 0,
            aiModel: analysis.model,
            diagnosis: analysis.diagnosis,
            confidence: analysis.confidence,
            recommendations: analysis.recommendations,
            processingTime: analysis.processingTime,
            cost: analysis.cost,
            tokens: analysis.tokensUsed,
          });
        }

        // Calculate consensus
        const consensus = calculateConsensus(analyses);

        return {
          analyses,
          consensus,
        };
      } catch (error) {
        console.error("Multi-Model Analysis Error:", error);
        throw new Error("Failed to perform comparative analysis");
      }
    }),

  /**
   * Validate diagnosis accuracy
   */
  validateDiagnosis: protectedProcedure
    .input(
      z.object({
        diagnosis: z.string(),
        actualDiagnosis: z.string(),
        confidence: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const validation = await validateDiagnosis(
        input.diagnosis,
        input.actualDiagnosis,
        input.confidence
      );

      return validation;
    }),

  /**
   * Get analysis history for user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        model: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = db.query.healthAnalyses.findMany({
        where: (table) => {
          const conditions = [table.userId === ctx.user.id];
          if (input.model) {
            conditions.push(table.aiModel === input.model);
          }
          return conditions.length > 1
            ? conditions.reduce((a, b) => a && b)
            : conditions[0];
        },
        limit: input.limit,
      });

      return query;
    }),

  /**
   * Get model performance metrics
   */
  getModelMetrics: protectedProcedure.query(async ({ ctx }) => {
    const analyses = await db.query.healthAnalyses.findMany({
      where: (table) => table.userId === ctx.user.id,
    });

    const metrics: Record<string, any> = {};

    analyses.forEach((analysis) => {
      if (!metrics[analysis.aiModel]) {
        metrics[analysis.aiModel] = {
          model: analysis.aiModel,
          totalAnalyses: 0,
          avgConfidence: 0,
          avgProcessingTime: 0,
          totalCost: 0,
          accurateCount: 0,
        };
      }

      const m = metrics[analysis.aiModel];
      m.totalAnalyses += 1;
      m.avgConfidence += analysis.confidence;
      m.avgProcessingTime += analysis.processingTime;
      m.totalCost += parseFloat(analysis.cost || "0");
      if (analysis.isAccurate === 1) m.accurateCount += 1;
    });

    // Calculate averages
    Object.values(metrics).forEach((m: any) => {
      if (m.totalAnalyses > 0) {
        m.avgConfidence = (m.avgConfidence / m.totalAnalyses).toFixed(2);
        m.avgProcessingTime = Math.round(m.avgProcessingTime / m.totalAnalyses);
        m.accuracyRate = ((m.accurateCount / m.totalAnalyses) * 100).toFixed(2);
      }
    });

    return Object.values(metrics);
  }),

  /**
   * Compare diagnoses across models
   */
  compareModels: protectedProcedure
    .input(
      z.object({
        analysisIds: z.array(z.number()),
      })
    )
    .query(async ({ ctx, input }) => {
      const analyses = await db.query.healthAnalyses.findMany({
        where: (table) =>
          table.userId === ctx.user.id && table.id.in(input.analysisIds),
      });

      const comparison = {
        totalAnalyses: analyses.length,
        models: analyses.map((a) => a.aiModel),
        diagnoses: analyses.map((a) => ({
          model: a.aiModel,
          diagnosis: a.diagnosis,
          confidence: a.confidence,
          cost: a.cost,
        })),
        consensus: calculateConsensus(
          analyses.map((a) => ({
            model: a.aiModel,
            diagnosis: a.diagnosis,
            confidence: a.confidence,
            recommendations: a.recommendations || "",
            processingTime: a.processingTime,
            tokensUsed: a.tokens || 0,
            cost: a.cost || "0",
          }))
        ),
      };

      return comparison;
    }),
});
