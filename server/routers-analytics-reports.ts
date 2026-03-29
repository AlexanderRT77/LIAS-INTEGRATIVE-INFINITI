import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createAnalyticsReport,
  getAnalyticsReports,
  getAnalyticsReport,
  updateAnalyticsReport,
  deleteAnalyticsReport,
  getReportHistory,
} from "./analytics-reports-db";

export const analyticsReportsRouter = router({
  /**
   * Create a new analytics report configuration
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        hour: z.number().min(0).max(23).default(9),
        minute: z.number().min(0).max(59).default(0),
        format: z.enum(["csv", "pdf"]).default("pdf"),
        destination: z.enum(["email", "googleDrive", "oneDrive"]).default("email"),
        recipientEmail: z.string().email().optional(),
        timeRange: z.enum(["7d", "30d", "90d"]).default("7d"),
        includeModels: z.array(z.string()).optional(),
        includeCategories: z.array(z.string()).optional(),
        includeBenchmarks: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createAnalyticsReport(ctx.user.id, {
        ...input,
        includeModels: input.includeModels ? JSON.stringify(input.includeModels) : null,
        includeCategories: input.includeCategories ? JSON.stringify(input.includeCategories) : null,
        includeBenchmarks: input.includeBenchmarks ? 1 : 0,
      } as any);
    }),

  /**
   * Get all analytics reports for the user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getAnalyticsReports(ctx.user.id);
  }),

  /**
   * Get a specific analytics report
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getAnalyticsReport(input.id, ctx.user.id);
    }),

  /**
   * Update an analytics report
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        hour: z.number().optional(),
        minute: z.number().optional(),
        format: z.enum(["csv", "pdf"]).optional(),
        destination: z.enum(["email", "googleDrive", "oneDrive"]).optional(),
        recipientEmail: z.string().email().optional(),
        timeRange: z.enum(["7d", "30d", "90d"]).optional(),
        includeModels: z.array(z.string()).optional(),
        includeCategories: z.array(z.string()).optional(),
        includeBenchmarks: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const updateData: any = { ...data };
      if (data.includeModels) updateData.includeModels = JSON.stringify(data.includeModels);
      if (data.includeCategories) updateData.includeCategories = JSON.stringify(data.includeCategories);
      if (data.includeBenchmarks !== undefined) updateData.includeBenchmarks = data.includeBenchmarks ? 1 : 0;
      if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;

      return await updateAnalyticsReport(id, ctx.user.id, updateData);
    }),

  /**
   * Delete an analytics report
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await deleteAnalyticsReport(input.id, ctx.user.id);
    }),

  /**
   * Get execution history for a report
   */
  history: protectedProcedure
    .input(z.object({ id: z.number(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const report = await getAnalyticsReport(input.id, ctx.user.id);
      if (!report) return [];

      return await getReportHistory(input.id, input.limit);
    }),

  /**
   * Test run a report (generate and send)
   */
  testRun: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await getAnalyticsReport(input.id, ctx.user.id);
      if (!report) throw new Error("Report not found");

      // TODO: Implement actual report generation and sending
      return {
        success: true,
        message: "Test run initiated. Report will be generated and sent shortly.",
      };
    }),
});
