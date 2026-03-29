import { db } from "../db";
import { healthAnalyses } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ReportOptions {
  userId: string;
  format: "pdf" | "csv" | "json" | "html";
  startDate?: Date;
  endDate?: Date;
  models?: string[];
  includeCharts?: boolean;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  analyses: any[];
  summary: {
    totalAnalyses: number;
    avgAccuracy: number;
    avgConfidence: number;
    totalCost: number;
    avgProcessingTime: number;
    modelBreakdown: Record<string, any>;
  };
}

/**
 * Generate comprehensive report
 */
export async function generateReport(options: ReportOptions): Promise<ReportData> {
  // Fetch analyses from database
  let analyses = await db.query.healthAnalyses.findMany({
    where: eq(healthAnalyses.userId, options.userId),
  });

  // Filter by date range if provided
  if (options.startDate || options.endDate) {
    analyses = analyses.filter((a) => {
      if (options.startDate && a.createdAt < options.startDate) return false;
      if (options.endDate && a.createdAt > options.endDate) return false;
      return true;
    });
  }

  // Filter by models if provided
  if (options.models && options.models.length > 0) {
    analyses = analyses.filter((a) => options.models!.includes(a.aiModel));
  }

  // Calculate summary statistics
  const summary = calculateSummary(analyses);

  const reportData: ReportData = {
    title: "Medical Analysis Report",
    generatedAt: new Date(),
    analyses,
    summary,
  };

  return reportData;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(analyses: any[]): ReportData["summary"] {
  if (analyses.length === 0) {
    return {
      totalAnalyses: 0,
      avgAccuracy: 0,
      avgConfidence: 0,
      totalCost: 0,
      avgProcessingTime: 0,
      modelBreakdown: {},
    };
  }

  const totalAccuracy = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0);
  const totalConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0);
  const totalCost = analyses.reduce((sum, a) => sum + parseFloat(a.cost || "0"), 0);
  const totalTime = analyses.reduce((sum, a) => sum + (a.processingTime || 0), 0);

  // Model breakdown
  const modelBreakdown: Record<string, any> = {};
  analyses.forEach((a) => {
    if (!modelBreakdown[a.aiModel]) {
      modelBreakdown[a.aiModel] = {
        count: 0,
        avgConfidence: 0,
        totalCost: 0,
        avgTime: 0,
      };
    }
    const m = modelBreakdown[a.aiModel];
    m.count += 1;
    m.avgConfidence += a.confidence || 0;
    m.totalCost += parseFloat(a.cost || "0");
    m.avgTime += a.processingTime || 0;
  });

  // Calculate averages for models
  Object.values(modelBreakdown).forEach((m: any) => {
    m.avgConfidence = (m.avgConfidence / m.count).toFixed(2);
    m.avgTime = Math.round(m.avgTime / m.count);
  });

  return {
    totalAnalyses: analyses.length,
    avgAccuracy: parseFloat((totalAccuracy / analyses.length).toFixed(2)),
    avgConfidence: parseFloat((totalConfidence / analyses.length).toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(4)),
    avgProcessingTime: Math.round(totalTime / analyses.length),
    modelBreakdown,
  };
}

/**
 * Export as CSV
 */
export function exportAsCSV(reportData: ReportData): string {
  const headers = [
    "Model",
    "Diagnosis",
    "Confidence",
    "Processing Time (ms)",
    "Cost",
    "Tokens",
    "Created At",
  ];

  const rows = reportData.analyses.map((a) => [
    a.aiModel,
    `"${a.diagnosis}"`,
    a.confidence,
    a.processingTime,
    a.cost,
    a.tokens,
    a.createdAt,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return csv;
}

/**
 * Export as JSON
 */
export function exportAsJSON(reportData: ReportData): string {
  return JSON.stringify(reportData, null, 2);
}

/**
 * Export as HTML
 */
export function exportAsHTML(reportData: ReportData): string {
  const timestamp = reportData.generatedAt.toLocaleString();

  const analysisRows = reportData.analyses
    .map(
      (a) => `
    <tr>
      <td>${a.aiModel}</td>
      <td>${a.diagnosis}</td>
      <td>${a.confidence}%</td>
      <td>${a.processingTime}ms</td>
      <td>$${a.cost}</td>
      <td>${a.tokens}</td>
    </tr>
  `
    )
    .join("");

  const modelBreakdownRows = Object.entries(reportData.summary.modelBreakdown)
    .map(
      ([model, stats]: [string, any]) => `
    <tr>
      <td>${model}</td>
      <td>${stats.count}</td>
      <td>${stats.avgConfidence}%</td>
      <td>${stats.avgTime}ms</td>
      <td>$${stats.totalCost.toFixed(4)}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #007bff; }
          h2 { color: #0056b3; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th { background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .summary-item { display: inline-block; margin-right: 30px; }
          .summary-item strong { color: #007bff; }
        </style>
      </head>
      <body>
        <h1>${reportData.title}</h1>
        <p><strong>Generated:</strong> ${timestamp}</p>
        
        <div class="summary">
          <h3>Summary Statistics</h3>
          <div class="summary-item">
            <strong>Total Analyses:</strong> ${reportData.summary.totalAnalyses}
          </div>
          <div class="summary-item">
            <strong>Avg Accuracy:</strong> ${reportData.summary.avgAccuracy}%
          </div>
          <div class="summary-item">
            <strong>Avg Confidence:</strong> ${reportData.summary.avgConfidence}%
          </div>
          <div class="summary-item">
            <strong>Total Cost:</strong> $${reportData.summary.totalCost}
          </div>
          <div class="summary-item">
            <strong>Avg Processing Time:</strong> ${reportData.summary.avgProcessingTime}ms
          </div>
        </div>

        <h2>Model Performance Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Count</th>
              <th>Avg Confidence</th>
              <th>Avg Processing Time</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${modelBreakdownRows}
          </tbody>
        </table>

        <h2>Detailed Analysis Results</h2>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Diagnosis</th>
              <th>Confidence</th>
              <th>Processing Time</th>
              <th>Cost</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            ${analysisRows}
          </tbody>
        </table>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This report was automatically generated by Antigravity Medical Hub.
        </p>
      </body>
    </html>
  `;
}

/**
 * Export as PDF (requires external service)
 */
export async function exportAsPDF(reportData: ReportData): Promise<Buffer> {
  // TODO: Implement PDF generation using a library like pdfkit or html2pdf
  // For now, return HTML as buffer
  const html = exportAsHTML(reportData);
  return Buffer.from(html, "utf-8");
}
