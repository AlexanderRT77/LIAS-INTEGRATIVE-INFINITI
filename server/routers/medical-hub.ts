import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import {
  healthParameters,
  patientHealthData,
  healthAnalyses,
  aiHealthBenchmarks,
  diagnosisComparison,
  validationHistory,
  analyses,
  analysisResponses,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Medical Hub Router
 * Gerencia análises de saúde, benchmarks de IA e validação de diagnósticos
 */
export const medicalHubRouter = router({
  // ============================================
  // HEALTH PARAMETERS
  // ============================================
  healthParameters: {
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.query.healthParameters.findMany({
        where: eq(healthParameters.userId, ctx.user.id),
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          parameterName: z.string().min(1),
          parameterType: z.enum(["numeric", "categorical", "boolean"]),
          unit: z.string().optional(),
          normalRange: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.insert(healthParameters).values({
          userId: ctx.user.id,
          ...input,
        });
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          parameterName: z.string().optional(),
          unit: z.string().optional(),
          normalRange: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db
          .update(healthParameters)
          .set(data)
          .where(
            and(
              eq(healthParameters.id, id),
              eq(healthParameters.userId, ctx.user.id)
            )
          );
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db
          .delete(healthParameters)
          .where(
            and(
              eq(healthParameters.id, input.id),
              eq(healthParameters.userId, ctx.user.id)
            )
          );
      }),
  },

  // ============================================
  // PATIENT HEALTH DATA
  // ============================================
  patientData: {
    list: protectedProcedure
      .input(
        z.object({
          parameterId: z.number().optional(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        let query = db.query.patientHealthData.findMany({
          where: eq(patientHealthData.userId, ctx.user.id),
          orderBy: desc(patientHealthData.recordedAt),
          limit: input.limit,
        });

        if (input.parameterId) {
          query = db.query.patientHealthData.findMany({
            where: and(
              eq(patientHealthData.userId, ctx.user.id),
              eq(patientHealthData.parameterId, input.parameterId)
            ),
            orderBy: desc(patientHealthData.recordedAt),
            limit: input.limit,
          });
        }

        return query;
      }),

    create: protectedProcedure
      .input(
        z.object({
          parameterId: z.number(),
          value: z.string(),
          recordedAt: z.date(),
          source: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.insert(patientHealthData).values({
          userId: ctx.user.id,
          ...input,
        });
      }),

    getTrends: protectedProcedure
      .input(
        z.object({
          parameterId: z.number(),
          days: z.number().default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        return db.query.patientHealthData.findMany({
          where: and(
            eq(patientHealthData.userId, ctx.user.id),
            eq(patientHealthData.parameterId, input.parameterId)
          ),
          orderBy: desc(patientHealthData.recordedAt),
        });
      }),
  },

  // ============================================
  // HEALTH ANALYSES
  // ============================================
  healthAnalyses: {
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.query.healthAnalyses.findMany({
          where: eq(healthAnalyses.userId, ctx.user.id),
          orderBy: desc(healthAnalyses.createdAt),
          limit: input.limit,
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          analysisId: z.number(),
          healthDataId: z.number(),
          aiModel: z.string(),
          diagnosis: z.string(),
          confidence: z.number(),
          recommendations: z.string().optional(),
          processingTime: z.number(),
          cost: z.string().optional(),
          tokens: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.insert(healthAnalyses).values({
          userId: ctx.user.id,
          ...input,
        });
      }),

    validate: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          isAccurate: z.number().min(0).max(1),
          validationNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, isAccurate, validationNotes } = input;

        // Update health analysis
        await db
          .update(healthAnalyses)
          .set({
            isAccurate,
            validatedBy: ctx.user.id,
            validationNotes,
            validationDate: new Date(),
          })
          .where(
            and(
              eq(healthAnalyses.id, id),
              eq(healthAnalyses.userId, ctx.user.id)
            )
          );

        // Log validation history
        const analysis = await db.query.healthAnalyses.findFirst({
          where: eq(healthAnalyses.id, id),
        });

        if (analysis) {
          await db.insert(validationHistory).values({
            userId: ctx.user.id,
            healthAnalysisId: id,
            validatorId: ctx.user.id,
            isAccurate,
            notes: validationNotes,
          });
        }

        return { success: true };
      }),

    getByModel: protectedProcedure
      .input(z.object({ aiModel: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.query.healthAnalyses.findMany({
          where: and(
            eq(healthAnalyses.userId, ctx.user.id),
            eq(healthAnalyses.aiModel, input.aiModel)
          ),
          orderBy: desc(healthAnalyses.createdAt),
        });
      }),
  },

  // ============================================
  // AI BENCHMARKS
  // ============================================
  benchmarks: {
    list: protectedProcedure.query(async () => {
      return db.query.aiHealthBenchmarks.findMany({
        orderBy: desc(aiHealthBenchmarks.rank),
      });
    }),

    getByModel: protectedProcedure
      .input(z.object({ aiModel: z.string() }))
      .query(async ({ input }) => {
        return db.query.aiHealthBenchmarks.findFirst({
          where: eq(aiHealthBenchmarks.aiModel, input.aiModel),
        });
      }),

    getRanking: protectedProcedure.query(async () => {
      return db.query.aiHealthBenchmarks.findMany({
        orderBy: desc(aiHealthBenchmarks.elo),
      });
    }),

    updateELO: adminProcedure
      .input(
        z.object({
          aiModel: z.string(),
          elo: z.number(),
          diagnosticAccuracy: z.number().optional(),
          successRate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await db.query.aiHealthBenchmarks.findFirst({
          where: eq(aiHealthBenchmarks.aiModel, input.aiModel),
        });

        if (existing) {
          return db
            .update(aiHealthBenchmarks)
            .set({
              elo: input.elo,
              diagnosticAccuracy: input.diagnosticAccuracy,
              successRate: input.successRate,
            })
            .where(eq(aiHealthBenchmarks.aiModel, input.aiModel));
        } else {
          return db.insert(aiHealthBenchmarks).values({
            aiModel: input.aiModel,
            elo: input.elo,
            rank: 0,
            diagnosticAccuracy: input.diagnosticAccuracy,
            successRate: input.successRate,
            overallScore: input.diagnosticAccuracy || 0,
          });
        }
      }),
  },

  // ============================================
  // DIAGNOSIS COMPARISON
  // ============================================
  diagnosisComparison: {
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.query.diagnosisComparison.findMany({
          where: eq(diagnosisComparison.userId, ctx.user.id),
          orderBy: desc(diagnosisComparison.createdAt),
          limit: input.limit,
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          healthDataId: z.number(),
          claude_diagnosis: z.string().optional(),
          gpt4_diagnosis: z.string().optional(),
          gemini_diagnosis: z.string().optional(),
          deepseek_diagnosis: z.string().optional(),
          perplexity_diagnosis: z.string().optional(),
          grok_diagnosis: z.string().optional(),
          consensusDiagnosis: z.string().optional(),
          agreementPercentage: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.insert(diagnosisComparison).values({
          userId: ctx.user.id,
          ...input,
        });
      }),

    compare: protectedProcedure
      .input(z.object({ healthDataId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.query.diagnosisComparison.findFirst({
          where: and(
            eq(diagnosisComparison.userId, ctx.user.id),
            eq(diagnosisComparison.healthDataId, input.healthDataId)
          ),
        });
      }),

    getConsensus: protectedProcedure
      .input(z.object({ healthDataId: z.number() }))
      .query(async ({ ctx, input }) => {
        const comparison = await db.query.diagnosisComparison.findFirst({
          where: and(
            eq(diagnosisComparison.userId, ctx.user.id),
            eq(diagnosisComparison.healthDataId, input.healthDataId)
          ),
        });

        return {
          consensus: comparison?.consensusDiagnosis,
          agreement: comparison?.agreementPercentage,
          validated: comparison?.validationDate ? true : false,
        };
      }),
  },

  // ============================================
  // VALIDATION HISTORY
  // ============================================
  validationHistory: {
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.query.validationHistory.findMany({
          where: eq(validationHistory.userId, ctx.user.id),
          orderBy: desc(validationHistory.createdAt),
          limit: input.limit,
        });
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      const validations = await db.query.validationHistory.findMany({
        where: eq(validationHistory.userId, ctx.user.id),
      });

      const total = validations.length;
      const accurate = validations.filter((v) => v.isAccurate === 1).length;
      const inaccurate = validations.filter((v) => v.isAccurate === 0).length;

      return {
        total,
        accurate,
        inaccurate,
        accuracyRate: total > 0 ? ((accurate / total) * 100).toFixed(2) : "0",
      };
    }),
  },
});
