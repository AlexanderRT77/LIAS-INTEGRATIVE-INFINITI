import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createScheduledAnalysis,
  getUserScheduledJobs,
  updateScheduledAnalysis,
  deleteScheduledAnalysis,
  pauseScheduledAnalysis,
  resumeScheduledAnalysis,
} from "../services/scheduled-analysis";
import {
  generateReport,
  exportAsCSV,
  exportAsJSON,
  exportAsHTML,
  exportAsPDF,
} from "../services/reports-generator";

export const automationRouter = router({
  /**
   * Create scheduled analysis
   */
  createScheduledAnalysis: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        prompt: z.string().min(10),
        frequency: z.enum(["daily", "weekly", "monthly", "custom"]),
        time: z.string(), // HH:MM format
        daysOfWeek: z.array(z.number()).optional(),
        notifyEmail: z.string().email().optional(),
        exportFormat: z.enum(["pdf", "csv", "json"]).optional(),
        cloudStorage: z.enum(["google_drive", "onedrive", "none"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const job = await createScheduledAnalysis({
        userId: ctx.user.id,
        name: input.name,
        prompt: input.prompt,
        frequency: input.frequency,
        time: input.time,
        daysOfWeek: input.daysOfWeek,
        enabled: true,
        notifyEmail: input.notifyEmail,
        exportFormat: input.exportFormat,
        cloudStorage: input.cloudStorage,
      });

      return job;
    }),

  /**
   * Get scheduled analyses for user
   */
  getScheduledAnalyses: protectedProcedure.query(({ ctx }) => {
    return getUserScheduledJobs(ctx.user.id);
  }),

  /**
   * Update scheduled analysis
   */
  updateScheduledAnalysis: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        name: z.string().optional(),
        prompt: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly", "custom"]).optional(),
        time: z.string().optional(),
        daysOfWeek: z.array(z.number()).optional(),
        notifyEmail: z.string().email().optional(),
        exportFormat: z.enum(["pdf", "csv", "json"]).optional(),
        cloudStorage: z.enum(["google_drive", "onedrive", "none"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updated = await updateScheduledAnalysis(input.jobId, {
        userId: "", // Will be preserved from existing job
        name: input.name,
        prompt: input.prompt,
        frequency: input.frequency,
        time: input.time,
        daysOfWeek: input.daysOfWeek,
        notifyEmail: input.notifyEmail,
        exportFormat: input.exportFormat,
        cloudStorage: input.cloudStorage,
        enabled: true,
      });

      return updated;
    }),

  /**
   * Delete scheduled analysis
   */
  deleteScheduledAnalysis: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(({ input }) => {
      const deleted = deleteScheduledAnalysis(input.jobId);
      return { success: deleted };
    }),

  /**
   * Pause scheduled analysis
   */
  pauseScheduledAnalysis: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(({ input }) => {
      const paused = pauseScheduledAnalysis(input.jobId);
      return paused;
    }),

  /**
   * Resume scheduled analysis
   */
  resumeScheduledAnalysis: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(({ input }) => {
      const resumed = resumeScheduledAnalysis(input.jobId);
      return resumed;
    }),

  /**
   * Generate report
   */
  generateReport: protectedProcedure
    .input(
      z.object({
        format: z.enum(["pdf", "csv", "json", "html"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        models: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const reportData = await generateReport({
        userId: ctx.user.id,
        format: input.format,
        startDate: input.startDate,
        endDate: input.endDate,
        models: input.models,
        includeCharts: true,
      });

      let content: string | Buffer;

      switch (input.format) {
        case "csv":
          content = exportAsCSV(reportData);
          break;
        case "json":
          content = exportAsJSON(reportData);
          break;
        case "html":
          content = exportAsHTML(reportData);
          break;
        case "pdf":
          content = await exportAsPDF(reportData);
          break;
        default:
          content = exportAsJSON(reportData);
      }

      return {
        format: input.format,
        content,
        filename: `report-${new Date().toISOString().split("T")[0]}.${input.format}`,
      };
    }),

  /**
   * Schedule report generation
   */
  scheduleReport: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        time: z.string(),
        format: z.enum(["pdf", "csv", "json", "html"]),
        email: z.string().email(),
        cloudStorage: z.enum(["google_drive", "onedrive", "none"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create a scheduled report job
      const job = await createScheduledAnalysis({
        userId: ctx.user.id,
        name: `Report: ${input.name}`,
        prompt: "Generate comprehensive analysis report",
        frequency: input.frequency,
        time: input.time,
        enabled: true,
        notifyEmail: input.email,
        exportFormat: input.format,
        cloudStorage: input.cloudStorage,
      });

      return job;
    }),

  /**
   * Export analysis data
   */
  exportAnalyses: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "json", "html"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const reportData = await generateReport({
        userId: ctx.user.id,
        format: input.format,
        startDate: input.startDate,
        endDate: input.endDate,
      });

      let content: string;

      switch (input.format) {
        case "csv":
          content = exportAsCSV(reportData);
          break;
        case "json":
          content = exportAsJSON(reportData);
          break;
        case "html":
          content = exportAsHTML(reportData);
          break;
        default:
          content = exportAsJSON(reportData);
      }

      return {
        format: input.format,
        content,
        filename: `export-${new Date().toISOString().split("T")[0]}.${input.format}`,
      };
    }),
});
