import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getUserLogs, getLogsByDateRange, getLogStats, createLog } from "./db";
import { exportRouter } from "./routers-export";
import { llmRouter, preferencesRouter, favoritesRouter, filtersRouter, reportsRouter } from "./routers-llm";
import { bibliographyRouter } from "./routers-bibliography";
import { scheduledRouter } from "./routers-scheduled";
import { analyticsRouter } from "./routers-analytics";
import { comparisonRouter } from "./routers-comparison";
import { analyticsReportsRouter } from "./routers-analytics-reports";
import { medicalHubRouter } from "./routers/medical-hub";
import { llmAnalysisRouter } from "./routers/llm-analysis";
import { automationRouter } from "./routers/automation";
import { webhooksRouter } from "./routers/webhooks";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  export: exportRouter,
  llm: llmRouter,
  preferences: preferencesRouter,
  favorites: favoritesRouter,
  filters: filtersRouter,
  reports: reportsRouter,
  bibliography: bibliographyRouter,
  scheduled: scheduledRouter,
  analytics: analyticsRouter,
  comparison: comparisonRouter,
  analyticsReports: analyticsReportsRouter,
  medicalHub: medicalHubRouter,
  llmAnalysis: llmAnalysisRouter,
  automation: automationRouter,
  webhooks: webhooksRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  logs: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await getUserLogs(ctx.user.id, input.limit, input.offset);
      }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await getLogsByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    stats: protectedProcedure
      .query(async ({ ctx }) => {
        return await getLogStats(ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        modelo: z.string(),
        categoria: z.string(),
        prompt: z.string(),
        resposta: z.string(),
        latencia: z.number(),
        tokens: z.number(),
        custo: z.string(),
        status: z.enum(["sucesso", "erro", "timeout"]),
        confianca: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createLog({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
