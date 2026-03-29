import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { scheduledExports, cloudStorageCredentials, exportHistory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  getGoogleDriveAuthUrl,
  getOneDriveAuthUrl,
  uploadToGoogleDrive,
  uploadToOneDrive,
  disconnectCloudStorage,
} from "./cloud-storage";

export const scheduledRouter = router({
  /**
   * Create a new scheduled export
   */
  createScheduled: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        searchQuery: z.string().min(1),
        filters: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        hour: z.number().min(0).max(23).default(9),
        exportFormat: z.enum(["csv", "pdf", "both"]),
        destination: z.enum(["email", "googleDrive", "oneDrive", "both"]),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(scheduledExports).values({
        userId: ctx.user.id,
        name: input.name,
        searchQuery: input.searchQuery,
        filters: input.filters,
        frequency: input.frequency,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        hour: input.hour,
        exportFormat: input.exportFormat,
        destination: input.destination,
        email: input.email,
        isActive: 1,
        nextRun: new Date(),
      });

      return result;
    }),

  /**
   * Get all scheduled exports for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const exports = await db
      .select()
      .from(scheduledExports)
      .where(eq(scheduledExports.userId, ctx.user.id));

    return exports;
  }),

  /**
   * Update a scheduled export
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        searchQuery: z.string().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
        hour: z.number().optional(),
        exportFormat: z.enum(["csv", "pdf", "both"]).optional(),
        destination: z.enum(["email", "googleDrive", "oneDrive", "both"]).optional(),
        email: z.string().email().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      const result = await db
        .update(scheduledExports)
        .set(updates)
        .where(
          and(
            eq(scheduledExports.id, id),
            eq(scheduledExports.userId, ctx.user.id)
          )
        );

      return result;
    }),

  /**
   * Delete a scheduled export
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .delete(scheduledExports)
        .where(
          and(
            eq(scheduledExports.id, input.id),
            eq(scheduledExports.userId, ctx.user.id)
          )
        );

      return result;
    }),

  /**
   * Get export history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(exportHistory)
        .where(eq(exportHistory.userId, ctx.user.id))
        .limit(input.limit)
        .offset(input.offset);

      return history;
    }),

  /**
   * Get Google Drive auth URL
   */
  getGoogleDriveAuthUrl: protectedProcedure.mutation(({ ctx }) => {
    return getGoogleDriveAuthUrl(ctx.user.id);
  }),

  /**
   * Get OneDrive auth URL
   */
  getOneDriveAuthUrl: protectedProcedure.mutation(({ ctx }) => {
    return getOneDriveAuthUrl(ctx.user.id);
  }),

  /**
   * Get cloud storage credentials status
   */
  getCloudStorageStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const credentials = await db
      .select()
      .from(cloudStorageCredentials)
      .where(eq(cloudStorageCredentials.userId, ctx.user.id));

    const status = {
      googleDrive: false,
      oneDrive: false,
    };

    for (const cred of credentials) {
      if (cred.provider === "googleDrive") {
        status.googleDrive = true;
      } else if (cred.provider === "oneDrive") {
        status.oneDrive = true;
      }
    }

    return status;
  }),

  /**
   * Disconnect cloud storage account
   */
  disconnectCloudStorage: protectedProcedure
    .input(z.object({ provider: z.enum(["googleDrive", "oneDrive"]) }))
    .mutation(async ({ ctx, input }) => {
      await disconnectCloudStorage(ctx.user.id, input.provider);
      return { success: true };
    }),

  /**
   * Upload file to cloud storage
   */
  uploadToCloud: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBuffer: z.instanceof(Buffer),
        provider: z.enum(["googleDrive", "oneDrive"]),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let fileUrl: string;

        if (input.provider === "googleDrive") {
          fileUrl = await uploadToGoogleDrive(
            ctx.user.id,
            input.fileName,
            input.fileBuffer,
            input.mimeType || "application/octet-stream"
          );
        } else {
          fileUrl = await uploadToOneDrive(
            ctx.user.id,
            input.fileName,
            input.fileBuffer
          );
        }

        return { success: true, fileUrl };
      } catch (error) {
        throw new Error(
          `Upload failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }),
});
