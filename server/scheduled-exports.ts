import { getDb } from "./db";
import { scheduledExports, exportHistory } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { searchPubMed } from "./pubmed";
import { exportToCSV, exportToPDF } from "./export";
import { notifyOwner } from "./_core/notification";
import nodemailer from "nodemailer";

/**
 * Job scheduler for automated exports
 * Runs periodically to check for scheduled exports that need to be executed
 */

// Configure email transporter (use environment variables in production)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Check if a scheduled export should run now
 */
function shouldRunNow(
  scheduled: typeof scheduledExports.$inferSelect,
  now: Date
): boolean {
  if (!scheduled.isActive) return false;
  if (!scheduled.nextRun || scheduled.nextRun > now) return false;

  return true;
}

/**
 * Calculate next run time for a scheduled export
 */
function calculateNextRun(
  scheduled: typeof scheduledExports.$inferSelect,
  lastRun: Date
): Date {
  const next = new Date(lastRun);
  const hour = scheduled.hour || 9;

  switch (scheduled.frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      next.setHours(hour, 0, 0, 0);
      break;

    case "weekly": {
      const dayOfWeek = scheduled.dayOfWeek || 0;
      const daysUntilNext = (dayOfWeek - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilNext);
      next.setHours(hour, 0, 0, 0);
      break;
    }

    case "monthly": {
      const dayOfMonth = scheduled.dayOfMonth || 1;
      next.setMonth(next.getMonth() + 1);
      next.setDate(dayOfMonth);
      next.setHours(hour, 0, 0, 0);
      break;
    }
  }

  return next;
}

/**
 * Execute a scheduled export
 */
async function executeScheduledExport(
  scheduled: typeof scheduledExports.$inferSelect
): Promise<void> {
  const now = new Date();
  const db = await getDb();
  if (!db) {
    console.error("[Scheduled Exports] Database not available");
    return;
  }

  try {
    // Record export as processing
    const exportId = await db
      .insert(exportHistory)
      .values({
        userId: scheduled.userId,
        scheduledExportId: scheduled.id,
        searchQuery: scheduled.searchQuery,
        format: scheduled.exportFormat === "both" ? "csv" : scheduled.exportFormat,
        destination: scheduled.destination === "both" ? "email" : scheduled.destination,
        status: "processing",
      });

    // Search for articles
    const pubmedArticles = await searchPubMed(scheduled.searchQuery, 10);

    // Convert to export format
    const articles = pubmedArticles.map((article) => ({
      id: article.pmid,
      title: article.title,
      authors: article.authors,
      source: article.source,
      pubdate: article.pubdate,
      abstract: article.abstract,
      url: article.url,
    }));

    // Generate exports
    const exports: { format: "csv" | "pdf"; data: Buffer | string }[] = [];

    if (
      scheduled.exportFormat === "csv" ||
      scheduled.exportFormat === "both"
    ) {
      const csvData = exportToCSV(articles, scheduled.searchQuery);
      exports.push({ format: "csv", data: csvData });
    }

    if (
      scheduled.exportFormat === "pdf" ||
      scheduled.exportFormat === "both"
    ) {
      const pdfData = await exportToPDF(articles, scheduled.searchQuery);
      exports.push({ format: "pdf", data: pdfData });
    }

    // Send to destinations
    if (
      scheduled.destination === "email" ||
      scheduled.destination === "both"
    ) {
      if (scheduled.email) {
        for (const exp of exports) {
          await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || "noreply@liasdash.com",
            to: scheduled.email,
            subject: `[LIAS] Relatório Bibliográfico - ${scheduled.name}`,
            html: `
              <h2>Relatório Bibliográfico Agendado</h2>
              <p><strong>Busca:</strong> ${scheduled.searchQuery}</p>
              <p><strong>Artigos encontrados:</strong> ${articles.length}</p>
              <p>Veja o arquivo anexado para mais detalhes.</p>
            `,
            attachments: [
              {
                filename: `relatorio-${scheduled.name}.${exp.format}`,
                content:
                  typeof exp.data === "string"
                    ? Buffer.from(exp.data)
                    : exp.data,
              },
            ],
          });
        }
      }
    }

    // Upload to cloud storage
    if (
      scheduled.destination === "googleDrive" ||
      scheduled.destination === "both"
    ) {
      // TODO: Implement Google Drive upload
    }

    if (
      scheduled.destination === "oneDrive" ||
      scheduled.destination === "both"
    ) {
      // TODO: Implement OneDrive upload
    }

    // Update export history
    await db
      .update(exportHistory)
      .set({
        status: "completed",
        exportedAt: now,
      })
      .where(eq(exportHistory.id, exportId[0].insertId));

    // Update scheduled export
    const nextRun = calculateNextRun(scheduled, now);
    await db
      .update(scheduledExports)
      .set({
        lastRun: now,
        nextRun,
      })
      .where(eq(scheduledExports.id, scheduled.id));

    // Notify owner
    await notifyOwner({
      title: "Relatório Agendado Enviado",
      content: `Relatório "${scheduled.name}" foi gerado e enviado com sucesso. ${articles.length} artigos encontrados.`,
    });
  } catch (error) {
    console.error(
      `Error executing scheduled export ${scheduled.id}:`,
      error
    );

    // Update export history with error
    await db
      .update(exportHistory)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(exportHistory.id, scheduled.id));

    // Notify owner of failure
    await notifyOwner({
      title: "Erro ao Gerar Relatório Agendado",
      content: `Falha ao gerar relatório "${scheduled.name}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

/**
 * Main job function - runs periodically to check and execute scheduled exports
 * Should be called every minute or every 5 minutes
 */
export async function runScheduledExportsJob(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Scheduled Exports] Database not available");
      return;
    }

    const now = new Date();

    // Get all active scheduled exports that should run now
    const scheduledToRun = await db
      .select()
      .from(scheduledExports)
      .where(
        and(
          eq(scheduledExports.isActive, 1),
          lte(scheduledExports.nextRun, now)
        )
      );

    console.log(
      `[Scheduled Exports] Found ${scheduledToRun.length} exports to run`
    );

    // Execute each scheduled export
    for (const scheduled of scheduledToRun) {
      await executeScheduledExport(scheduled);
    }
  } catch (error) {
    console.error("[Scheduled Exports] Job error:", error);
  }
}

/**
 * Initialize the scheduler
 * In production, this should be called from a background job service
 */
export function initializeScheduler(): void {
  // Run every 5 minutes
  setInterval(() => {
    runScheduledExportsJob().catch((error) => {
      console.error("[Scheduler] Unexpected error:", error);
    });
  }, 5 * 60 * 1000);

  console.log("[Scheduler] Initialized - running every 5 minutes");
}
