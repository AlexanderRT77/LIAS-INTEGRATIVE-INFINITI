export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send email notification
 * In production, integrate with Nodemailer, SendGrid, or AWS SES
 */
export async function sendEmailNotification(options: EmailOptions): Promise<boolean> {
  try {
    // TODO: Implement actual email sending
    // For now, this is a placeholder that logs the email
    console.log(`[EMAIL] Sending to: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] HTML Length: ${options.html.length} chars`);

    // In production, use:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: options.from || 'noreply@antigravity.ai',
    //   to: options.to,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send analysis completion notification
 */
export async function notifyAnalysisComplete(
  email: string,
  analysisName: string,
  results: any
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Analysis Complete</h2>
        <p>Your analysis <strong>${analysisName}</strong> has been completed.</p>
        <p>Results are ready for review in your dashboard.</p>
        <a href="https://antigravity.ai/medical-hub" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Results
        </a>
      </body>
    </html>
  `;

  return sendEmailNotification({
    to: email,
    subject: `Analysis Complete: ${analysisName}`,
    html,
  });
}

/**
 * Send error notification
 */
export async function notifyAnalysisError(
  email: string,
  analysisName: string,
  error: string
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Analysis Error</h2>
        <p>Your analysis <strong>${analysisName}</strong> encountered an error:</p>
        <p style="background-color: #f8d7da; padding: 10px; border-radius: 5px; color: #721c24;">
          ${error}
        </p>
        <p>Please try again or contact support if the issue persists.</p>
      </body>
    </html>
  `;

  return sendEmailNotification({
    to: email,
    subject: `Analysis Error: ${analysisName}`,
    html,
  });
}

/**
 * Send scheduled report
 */
export async function sendScheduledReport(
  email: string,
  reportName: string,
  reportHtml: string
): Promise<boolean> {
  return sendEmailNotification({
    to: email,
    subject: `Scheduled Report: ${reportName}`,
    html: reportHtml,
  });
}

/**
 * Send daily summary
 */
export async function sendDailySummary(
  email: string,
  stats: {
    totalAnalyses: number;
    avgAccuracy: number;
    totalCost: number;
    topModel: string;
  }
): Promise<boolean> {
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Daily Summary</h2>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Total Analyses</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${stats.totalAnalyses}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Average Accuracy</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${stats.avgAccuracy.toFixed(2)}%</strong></td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Total Cost</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>$${stats.totalCost.toFixed(4)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Top Model</td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${stats.topModel}</strong></td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendEmailNotification({
    to: email,
    subject: "Daily Summary Report",
    html,
  });
}
