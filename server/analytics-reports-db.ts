import { getDb } from "./db";
import { analyticsReports, analyticsReportHistory, AnalyticsReport, InsertAnalyticsReport } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Create a new analytics report configuration
 */
export async function createAnalyticsReport(
  userId: number,
  data: Omit<InsertAnalyticsReport, "userId" | "createdAt" | "updatedAt">
): Promise<AnalyticsReport | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(analyticsReports).values({
    ...data,
    userId,
  });

  const reportId = (result as any)[0]?.insertId;
  if (!reportId) return null;

  return await getAnalyticsReport(reportId as number, userId);
}

/**
 * Get all analytics reports for a user
 */
export async function getAnalyticsReports(userId: number): Promise<AnalyticsReport[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(analyticsReports)
    .where(eq(analyticsReports.userId, userId))
    .orderBy(desc(analyticsReports.createdAt));
}

/**
 * Get a specific analytics report
 */
export async function getAnalyticsReport(id: number, userId: number): Promise<AnalyticsReport | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(analyticsReports)
    .where(eq(analyticsReports.id, id))
    .limit(1);

  return result.length > 0 && result[0]?.userId === userId ? result[0] : null;
}

/**
 * Update an analytics report
 */
export async function updateAnalyticsReport(
  id: number,
  userId: number,
  data: Partial<Omit<InsertAnalyticsReport, "userId" | "createdAt">>
): Promise<AnalyticsReport | null> {
  const db = await getDb();
  if (!db) return null;

  // Verify ownership
  const existing = await getAnalyticsReport(id, userId);
  if (!existing) return null;

  await db
    .update(analyticsReports)
    .set(data)
    .where(eq(analyticsReports.id, id));

  return await getAnalyticsReport(id, userId);
}

/**
 * Delete an analytics report
 */
export async function deleteAnalyticsReport(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verify ownership
  const existing = await getAnalyticsReport(id, userId);
  if (!existing) return false;

  await db.delete(analyticsReports).where(eq(analyticsReports.id, id));
  return true;
}

/**
 * Get active reports that need to run
 */
export async function getActiveAnalyticsReports(): Promise<AnalyticsReport[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(analyticsReports)
    .where(eq(analyticsReports.isActive, 1));
}

/**
 * Update next run time for a report
 */
export async function updateNextRunTime(id: number, nextRunAt: Date): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(analyticsReports)
    .set({ nextRunAt })
    .where(eq(analyticsReports.id, id));

  return true;
}

/**
 * Add report execution to history
 */
export async function addReportHistory(
  reportId: number,
  userId: number,
  status: "pending" | "processing" | "completed" | "failed",
  fileUrl?: string,
  fileSize?: number,
  errorMessage?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.insert(analyticsReportHistory).values({
    reportId,
    userId,
    status,
    fileUrl,
    fileSize,
    errorMessage,
  });

  return true;
}

/**
 * Get report execution history
 */
export async function getReportHistory(reportId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(analyticsReportHistory)
    .where(eq(analyticsReportHistory.reportId, reportId))
    .orderBy(desc(analyticsReportHistory.executedAt))
    .limit(limit);
}
