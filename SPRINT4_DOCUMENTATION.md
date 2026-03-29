# Sprint 4 - Automation, Reports & Cloud Integration

## Overview

Sprint 4 implements the final 7 phases of the Antigravity Medical Hub, focusing on automation, reporting, and cloud integration capabilities.

---

## Implemented Phases

### **Fase 11: Scheduled Analysis Automation** ✅

**Service:** `server/services/scheduled-analysis.ts`

**Features:**
- Create scheduled analysis jobs with cron-like scheduling
- Support for daily, weekly, and monthly frequencies
- Automatic execution at specified times
- Email notifications on completion
- Automatic data export to cloud storage
- Job pause/resume functionality

**Key Functions:**
```typescript
createScheduledAnalysis(config)      // Create new scheduled job
calculateNextRun(config)             // Calculate next execution time
executeScheduledAnalysis(job)        // Execute scheduled analysis
getUserScheduledJobs(userId)         // Get user's scheduled jobs
updateScheduledAnalysis(jobId, config)
deleteScheduledAnalysis(jobId)
pauseScheduledAnalysis(jobId)
resumeScheduledAnalysis(jobId)
```

**Example Usage:**
```typescript
const job = await createScheduledAnalysis({
  userId: "user-123",
  name: "Daily Health Check",
  prompt: "Analyze current health parameters",
  frequency: "daily",
  time: "09:00",
  notifyEmail: "user@example.com",
  exportFormat: "pdf",
  cloudStorage: "google_drive"
});
```

---

### **Fase 12: Advanced Reports** ✅

**Service:** `server/services/reports-generator.ts`

**Features:**
- Generate comprehensive reports in multiple formats
- CSV, JSON, HTML, and PDF export
- Summary statistics and model performance breakdown
- Customizable date ranges and model filtering
- Professional HTML templates

**Supported Formats:**
- **CSV** - Tabular data for spreadsheets
- **JSON** - Structured data for APIs
- **HTML** - Professional web-ready reports
- **PDF** - Print-ready documents (requires external service)

**Key Functions:**
```typescript
generateReport(options)              // Generate comprehensive report
exportAsCSV(reportData)              // Export to CSV format
exportAsJSON(reportData)             // Export to JSON format
exportAsHTML(reportData)             // Export to HTML format
exportAsPDF(reportData)              // Export to PDF format
calculateSummary(analyses)           // Calculate statistics
```

**Report Data Structure:**
```typescript
{
  title: string;
  generatedAt: Date;
  analyses: Array<{
    aiModel: string;
    diagnosis: string;
    confidence: number;
    processingTime: number;
    cost: string;
    tokens: number;
  }>;
  summary: {
    totalAnalyses: number;
    avgAccuracy: number;
    avgConfidence: number;
    totalCost: number;
    avgProcessingTime: number;
    modelBreakdown: Record<string, any>;
  };
}
```

---

### **Fase 13: Cloud Integration** ✅

**Service:** `server/services/cloud-integration.ts`

**Features:**
- Google Drive integration for file storage
- OneDrive integration for Microsoft ecosystem
- Upload, list, delete, and share files
- Automatic file management
- Shareable links generation

**Supported Providers:**
- Google Drive
- OneDrive
- Extensible for other providers

**Key Functions:**
```typescript
uploadToCloudStorage(fileName, content, provider, config)
uploadToGoogleDrive(fileName, content, config)
uploadToOneDrive(fileName, content, config)
listCloudFiles(provider, config)
deleteCloudFile(fileId, provider, config)
shareCloudFile(fileId, provider, config, permissions)
```

**Example Usage:**
```typescript
const result = await uploadToCloudStorage(
  "report-2026-03-29.pdf",
  pdfBuffer,
  "google_drive",
  { accessToken: "...", folderId: "..." }
);
// Returns: { fileId, fileName, url, provider }
```

---

### **Fase 14: Email Notifications** ✅

**Service:** `server/services/email-service.ts`

**Features:**
- Send analysis completion notifications
- Error notifications with details
- Scheduled report delivery
- Daily summary reports
- HTML email templates

**Key Functions:**
```typescript
sendEmailNotification(options)       // Generic email sender
notifyAnalysisComplete(email, name, results)
notifyAnalysisError(email, name, error)
sendScheduledReport(email, name, html)
sendDailySummary(email, stats)
```

**Email Templates:**
- Analysis completion notification
- Error alert with troubleshooting
- Scheduled report delivery
- Daily summary with statistics

---

### **Fase 15: Data Export** ✅

**Router:** `server/routers/automation.ts`

**tRPC Endpoints:**
```typescript
automation.generateReport()          // Generate custom report
automation.exportAnalyses()          // Export analysis data
automation.scheduleReport()          // Schedule report generation
```

**Supported Formats:**
- CSV for spreadsheet analysis
- JSON for API integration
- HTML for web viewing
- PDF for printing

**Export Options:**
- Date range filtering
- Model selection
- Format customization
- Cloud storage destination

---

### **Fase 16: Webhooks & API** ✅

**Router:** `server/routers/webhooks.ts`

**Features:**
- Register external webhooks
- Event-driven architecture
- Multiple event types support
- Webhook testing and monitoring
- Event history tracking

**Supported Events:**
- `analysis.completed` - When analysis finishes
- `report.generated` - When report is created
- `error.occurred` - When error happens

**Key Functions:**
```typescript
webhooksRouter.register()            // Register new webhook
webhooksRouter.list()                // List all webhooks
webhooksRouter.update()              // Update webhook config
webhooksRouter.delete()              // Delete webhook
webhooksRouter.test()                // Test webhook delivery
webhooksRouter.getEvents()           // Get event history
triggerWebhookEvent(event)           // Trigger webhook event
```

**Webhook Payload:**
```json
{
  "id": "event-123",
  "type": "analysis.completed",
  "timestamp": "2026-03-29T12:00:00Z",
  "data": {
    "analysisId": "...",
    "model": "claude",
    "diagnosis": "...",
    "confidence": 95
  }
}
```

---

### **Fase 17: Automation UI** ✅

**Component:** `client/src/pages/MedicalHub/Automation.tsx`

**Features:**
- Schedule new analyses with intuitive form
- View and manage scheduled jobs
- Pause/resume/delete jobs
- Generate and download reports
- View recent reports
- Cloud storage configuration
- Email notification settings

**UI Sections:**
1. **Scheduled Tab** - List of active scheduled jobs
2. **Create Tab** - Form to create new scheduled analysis
3. **Reports Tab** - Generate and manage reports

**Scheduling Options:**
- Frequency: Daily, Weekly, Monthly
- Time selection (HH:MM format)
- Export format: PDF, CSV, JSON
- Cloud storage: Google Drive, OneDrive, None
- Email notifications

---

## tRPC Endpoints Summary

### Automation Router

```typescript
automation.createScheduledAnalysis()  // Create scheduled job
automation.getScheduledAnalyses()     // List user's jobs
automation.updateScheduledAnalysis()  // Update job config
automation.deleteScheduledAnalysis()  // Delete job
automation.pauseScheduledAnalysis()   // Pause execution
automation.resumeScheduledAnalysis()  // Resume execution
automation.generateReport()           // Generate custom report
automation.scheduleReport()           // Schedule report
automation.exportAnalyses()           // Export analysis data
```

### Webhooks Router

```typescript
webhooksRouter.register()             // Register webhook
webhooksRouter.list()                 // List webhooks
webhooksRouter.update()               // Update webhook
webhooksRouter.delete()               // Delete webhook
webhooksRouter.test()                 // Test webhook
webhooksRouter.getEvents()            // Get event history
```

---

## Database Integration

### Tables Used

- `health_analyses` - Store analysis results
- `scheduled_jobs` - Store scheduled analysis configs (TODO)
- `webhooks` - Store webhook registrations (TODO)
- `email_logs` - Store email delivery logs (TODO)

### Schema Extensions Needed

```sql
CREATE TABLE scheduled_jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  frequency ENUM('daily', 'weekly', 'monthly', 'custom'),
  time VARCHAR(5),
  days_of_week JSON,
  notify_email VARCHAR(255),
  export_format ENUM('pdf', 'csv', 'json'),
  cloud_storage ENUM('google_drive', 'onedrive', 'none'),
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP,
  next_run TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  events JSON NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE email_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status ENUM('sent', 'failed', 'pending'),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Integration Points

### Email Service
- **TODO:** Integrate Nodemailer or SendGrid
- **Environment Variables Needed:**
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - Or SendGrid API key

### Cloud Storage
- **Google Drive:** Requires OAuth2 setup
- **OneDrive:** Requires Microsoft Graph API setup
- **Environment Variables Needed:**
  - `GOOGLE_DRIVE_CLIENT_ID`
  - `GOOGLE_DRIVE_CLIENT_SECRET`
  - `ONEDRIVE_CLIENT_ID`
  - `ONEDRIVE_CLIENT_SECRET`

### PDF Generation
- **TODO:** Integrate pdfkit or html2pdf
- **Package:** `npm install pdfkit` or `npm install html2pdf`

---

## Routes Added

```
/medical-hub/automation          → Automation Dashboard
```

---

## Usage Examples

### Schedule Daily Analysis

```typescript
const job = await trpc.automation.createScheduledAnalysis.mutate({
  name: "Daily Health Check",
  prompt: "Analyze current health status",
  frequency: "daily",
  time: "09:00",
  notifyEmail: "user@example.com",
  exportFormat: "pdf",
  cloudStorage: "google_drive"
});
```

### Generate Report

```typescript
const report = await trpc.automation.generateReport.query({
  format: "pdf",
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-03-29"),
  models: ["claude", "gpt4"]
});
```

### Register Webhook

```typescript
const webhook = await trpc.webhooksRouter.register.mutate({
  url: "https://example.com/webhooks/analysis",
  events: ["analysis.completed", "error.occurred"]
});
```

---

## Testing

### Manual Testing Checklist

- [ ] Create scheduled analysis
- [ ] Verify job appears in list
- [ ] Test pause/resume functionality
- [ ] Delete scheduled job
- [ ] Generate report in each format
- [ ] Export analysis data
- [ ] Register webhook
- [ ] Test webhook delivery
- [ ] Verify email notifications (when email service integrated)
- [ ] Test cloud storage upload (when OAuth configured)

### Vitest Tests Needed

```typescript
// automation.test.ts
describe("Automation", () => {
  test("createScheduledAnalysis", () => {});
  test("getScheduledAnalyses", () => {});
  test("updateScheduledAnalysis", () => {});
  test("deleteScheduledAnalysis", () => {});
  test("generateReport", () => {});
  test("exportAnalyses", () => {});
});

// webhooks.test.ts
describe("Webhooks", () => {
  test("register webhook", () => {});
  test("list webhooks", () => {});
  test("test webhook", () => {});
  test("trigger webhook event", () => {});
});
```

---

## Next Steps

### Immediate (Priority 1)
1. Integrate email service (Nodemailer/SendGrid)
2. Add database tables for persistence
3. Write vitest tests
4. Test all endpoints

### Short-term (Priority 2)
1. Implement Google Drive OAuth integration
2. Implement OneDrive OAuth integration
3. Add PDF generation
4. Add event history storage

### Long-term (Priority 3)
1. Advanced scheduling (cron expressions)
2. Batch operations
3. Report templates customization
4. Webhook retry logic
5. Rate limiting

---

## Performance Considerations

- **Job Queue:** Consider using Bull or Agenda for production
- **Email Batching:** Batch email sends for efficiency
- **Cloud Storage:** Implement caching for file lists
- **Webhooks:** Add retry logic with exponential backoff
- **Reports:** Cache generated reports for quick access

---

## Security Considerations

- **API Keys:** Store cloud storage tokens securely
- **Webhooks:** Validate webhook signatures
- **Email:** Sanitize email content
- **Reports:** Ensure user data isolation
- **Rate Limiting:** Implement rate limits on API endpoints

---

## Monitoring & Logging

- Log all scheduled job executions
- Track email delivery status
- Monitor webhook failures
- Log cloud storage operations
- Alert on repeated failures

---

## Deployment Checklist

- [ ] All services implemented
- [ ] All routers integrated
- [ ] UI components created
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] Tests passing
- [ ] Error handling complete
- [ ] Logging configured
- [ ] Security review done
- [ ] Performance optimized
