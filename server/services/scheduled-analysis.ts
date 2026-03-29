import { db } from "../db";
import { healthAnalyses } from "../../drizzle/schema";
import { invokeAllModels } from "./llm-integration";
import { sendEmailNotification } from "./email-service";

export interface ScheduledAnalysisConfig {
  userId: string;
  name: string;
  prompt: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  time: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6, 0 = Sunday
  enabled: boolean;
  notifyEmail?: string;
  exportFormat?: "pdf" | "csv" | "json";
  cloudStorage?: "google_drive" | "onedrive" | "none";
}

export interface AnalysisScheduleJob {
  id: string;
  config: ScheduledAnalysisConfig;
  lastRun?: Date;
  nextRun: Date;
  status: "active" | "paused" | "completed";
}

// In-memory job queue (in production, use a proper job queue like Bull or Agenda)
const scheduledJobs = new Map<string, AnalysisScheduleJob>();

/**
 * Create a scheduled analysis job
 */
export async function createScheduledAnalysis(
  config: ScheduledAnalysisConfig
): Promise<AnalysisScheduleJob> {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const nextRun = calculateNextRun(config);

  const job: AnalysisScheduleJob = {
    id: jobId,
    config,
    nextRun,
    status: "active",
  };

  scheduledJobs.set(jobId, job);

  // Schedule the job
  scheduleJob(job);

  return job;
}

/**
 * Calculate next run time based on schedule config
 */
function calculateNextRun(config: ScheduledAnalysisConfig): Date {
  const now = new Date();
  const [hours, minutes] = config.time.split(":").map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    // If the time has passed today, schedule for tomorrow
    nextRun.setDate(nextRun.getDate() + 1);
  }

  if (config.frequency === "weekly" && config.daysOfWeek) {
    // Find next matching day of week
    while (!config.daysOfWeek.includes(nextRun.getDay())) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  } else if (config.frequency === "monthly") {
    nextRun.setMonth(nextRun.getMonth() + 1);
  }

  return nextRun;
}

/**
 * Schedule a job for execution
 */
function scheduleJob(job: AnalysisScheduleJob): void {
  const delay = job.nextRun.getTime() - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      executeScheduledAnalysis(job);
    }, delay);
  }
}

/**
 * Execute a scheduled analysis
 */
async function executeScheduledAnalysis(job: AnalysisScheduleJob): Promise<void> {
  try {
    console.log(`Executing scheduled analysis: ${job.config.name}`);

    // Perform the analysis with all 6 models
    const analyses = await invokeAllModels({
      prompt: job.config.prompt,
    });

    // Store results
    for (const analysis of analyses) {
      await db.insert(healthAnalyses).values({
        userId: job.config.userId,
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

    // Send notification if configured
    if (job.config.notifyEmail) {
      await sendEmailNotification({
        to: job.config.notifyEmail,
        subject: `Scheduled Analysis Completed: ${job.config.name}`,
        html: generateAnalysisReport(analyses, job.config),
      });
    }

    // Export data if configured
    if (job.config.exportFormat) {
      await exportAnalysisData(analyses, job.config);
    }

    // Update job status
    job.lastRun = new Date();
    job.nextRun = calculateNextRun(job.config);

    // Reschedule if not a one-time job
    if (job.config.frequency !== "custom") {
      scheduleJob(job);
    } else {
      job.status = "completed";
    }
  } catch (error) {
    console.error(`Error executing scheduled analysis ${job.id}:`, error);
    // Reschedule for retry
    job.nextRun = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes
    scheduleJob(job);
  }
}

/**
 * Generate HTML report from analysis results
 */
function generateAnalysisReport(analyses: any[], config: ScheduledAnalysisConfig): string {
  const timestamp = new Date().toLocaleString();

  const analysisRows = analyses
    .map(
      (a) => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${a.model}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${a.diagnosis}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${a.confidence}%</td>
      <td style="padding: 10px; border: 1px solid #ddd;">${a.processingTime}ms</td>
      <td style="padding: 10px; border: 1px solid #ddd;">$${a.cost}</td>
    </tr>
  `
    )
    .join("");

  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Scheduled Analysis Report</h2>
        <p><strong>Analysis:</strong> ${config.name}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        
        <h3>Results</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; border: 1px solid #ddd;">Model</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Diagnosis</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Confidence</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Processing Time</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${analysisRows}
          </tbody>
        </table>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated report generated by Antigravity Medical Hub.
        </p>
      </body>
    </html>
  `;
}

/**
 * Export analysis data to file
 */
async function exportAnalysisData(
  analyses: any[],
  config: ScheduledAnalysisConfig
): Promise<void> {
  if (config.exportFormat === "csv") {
    // CSV export
    const csv = [
      "Model,Diagnosis,Confidence,ProcessingTime,Cost",
      ...analyses.map(
        (a) =>
          `"${a.model}","${a.diagnosis}",${a.confidence},${a.processingTime},${a.cost}`
      ),
    ].join("\n");

    // Upload to cloud storage if configured
    if (config.cloudStorage) {
      await uploadToCloudStorage(csv, config, "csv");
    }
  } else if (config.exportFormat === "json") {
    // JSON export
    const json = JSON.stringify(analyses, null, 2);

    if (config.cloudStorage) {
      await uploadToCloudStorage(json, config, "json");
    }
  }
}

/**
 * Upload file to cloud storage
 */
async function uploadToCloudStorage(
  data: string,
  config: ScheduledAnalysisConfig,
  format: string
): Promise<void> {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `analysis-${config.name}-${timestamp}.${format}`;

  if (config.cloudStorage === "google_drive") {
    // TODO: Implement Google Drive upload
    console.log(`Would upload to Google Drive: ${filename}`);
  } else if (config.cloudStorage === "onedrive") {
    // TODO: Implement OneDrive upload
    console.log(`Would upload to OneDrive: ${filename}`);
  }
}

/**
 * Get all scheduled jobs for a user
 */
export function getUserScheduledJobs(userId: string): AnalysisScheduleJob[] {
  return Array.from(scheduledJobs.values()).filter((job) => job.config.userId === userId);
}

/**
 * Update a scheduled job
 */
export async function updateScheduledAnalysis(
  jobId: string,
  config: Partial<ScheduledAnalysisConfig>
): Promise<AnalysisScheduleJob | null> {
  const job = scheduledJobs.get(jobId);
  if (!job) return null;

  job.config = { ...job.config, ...config };
  job.nextRun = calculateNextRun(job.config);

  scheduleJob(job);
  return job;
}

/**
 * Delete a scheduled job
 */
export function deleteScheduledAnalysis(jobId: string): boolean {
  return scheduledJobs.delete(jobId);
}

/**
 * Pause a scheduled job
 */
export function pauseScheduledAnalysis(jobId: string): AnalysisScheduleJob | null {
  const job = scheduledJobs.get(jobId);
  if (job) {
    job.status = "paused";
  }
  return job || null;
}

/**
 * Resume a scheduled job
 */
export function resumeScheduledAnalysis(jobId: string): AnalysisScheduleJob | null {
  const job = scheduledJobs.get(jobId);
  if (job) {
    job.status = "active";
    scheduleJob(job);
  }
  return job || null;
}
