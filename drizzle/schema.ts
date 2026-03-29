import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const logs = mysqlTable("logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  modelo: varchar("modelo", { length: 64 }).notNull(),
  categoria: varchar("categoria", { length: 64 }).notNull(),
  prompt: text("prompt").notNull(),
  resposta: text("resposta").notNull(),
  latencia: int("latencia").notNull(),
  tokens: int("tokens").notNull(),
  custo: varchar("custo", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["sucesso", "erro", "timeout"]).default("sucesso").notNull(),
  confianca: varchar("confianca", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;

/**
 * Análises colaborativas da liga
 * Cada análise contém dados de uma pergunta/prompt testado em múltiplas IAs
 */
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  createdBy: int("createdBy").notNull(),
  teamId: int("teamId"),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Respostas das IAs para cada análise
 * Armazena resposta, custo, tokens, tempo, notas e quem inseriu
 */
export const analysisResponses = mysqlTable("analysis_responses", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull(),
  aiModel: varchar("aiModel", { length: 64 }).notNull(), // manus, claude, deepseek, perplexity, grok, chat_z_ai
  response: text("response"),
  tokens: int("tokens"),
  cost: varchar("cost", { length: 32 }),
  processingTime: int("processingTime"), // em ms
  notes: text("notes"),
  rating: int("rating"), // 1-5 stars
  submittedBy: int("submittedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalysisResponse = typeof analysisResponses.$inferSelect;
export type InsertAnalysisResponse = typeof analysisResponses.$inferInsert;

/**
 * Membros da liga
 * Controla quem faz parte da liga e suas permissões
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId"),
  role: mysqlEnum("role", ["admin", "editor", "viewer"]).default("viewer").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Auditoria de mudanças
 * Rastreia todas as alterações feitas nas análises
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId"),
  responseId: int("responseId"),
  action: varchar("action", { length: 64 }).notNull(), // created, updated, deleted, imported
  userId: int("userId").notNull(),
  changes: text("changes"), // JSON com antes/depois
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Cache de artigos do PubMed
 * Armazena resultados de buscas para evitar chamadas repetidas à API
 */
export const cacheArtigos = mysqlTable("cache_artigos", {
  id: int("id").autoincrement().primaryKey(),
  termoBusca: varchar("termo_busca", { length: 255 }).notNull().unique(),
  resultados: text("resultados").notNull(), // JSON array com artigos
  dataBusca: timestamp("data_busca").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CacheArtigo = typeof cacheArtigos.$inferSelect;
export type InsertCacheArtigo = typeof cacheArtigos.$inferInsert;

/**
 * Cache de dados de IA em tempo real
 * Armazena dados de artificialanalysis.ai para análise comparativa
 */
export const cacheModelosIA = mysqlTable("cache_modelos_ia", {
  id: int("id").autoincrement().primaryKey(),
  nomeModelo: varchar("nome_modelo", { length: 255 }).notNull().unique(),
  acuracia: int("acuracia").notNull(),
  velocidade: int("velocidade").notNull(), // tokens/segundo
  custo: varchar("custo", { length: 50 }).notNull(), // preço por 1M tokens
  categoria: varchar("categoria", { length: 100 }).notNull(),
  ranking: int("ranking").notNull(),
  dados: text("dados").notNull(), // JSON com dados completos
  dataAtualizacao: timestamp("data_atualizacao").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CacheModeloIA = typeof cacheModelosIA.$inferSelect;
export type InsertCacheModeloIA = typeof cacheModelosIA.$inferInsert;


/**
 * Preferências de usuário
 * Armazena configurações e preferências personalizadas
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  theme: varchar("theme", { length: 50 }).default("cyberpunk"),
  defaultFilters: text("defaultFilters"), // JSON string
  favoriteModels: text("favoriteModels"), // JSON array de nomes de modelos
  notificationsEnabled: int("notificationsEnabled").default(1),
  autoReportFrequency: varchar("autoReportFrequency", { length: 50 }).default("weekly"), // daily, weekly, monthly
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

/**
 * Análises favoritas
 * Permite que usuários salvem análises para acesso rápido
 */
export const favoriteAnalyses = mysqlTable("favorite_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type FavoriteAnalyses = typeof favoriteAnalyses.$inferSelect;
export type InsertFavoriteAnalyses = typeof favoriteAnalyses.$inferInsert;

/**
 * Filtros salvos
 * Permite que usuários salvem configurações de filtros para reutilização
 */
export const savedFilters = mysqlTable("saved_filters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  filterName: varchar("filterName", { length: 255 }).notNull(),
  filterConfig: text("filterConfig").notNull(), // JSON string
  isDefault: int("isDefault").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedFilters = typeof savedFilters.$inferSelect;
export type InsertSavedFilters = typeof savedFilters.$inferInsert;

/**
 * Análises geradas por LLM
 * Armazena análises automáticas geradas pelo LLM
 */
export const llmAnalyses = mysqlTable("llm_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // "article_summary", "model_comparison", "trend_analysis"
  inputData: text("inputData").notNull(), // JSON string
  analysis: text("analysis").notNull(), // análise gerada pelo LLM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LLMAnalyses = typeof llmAnalyses.$inferSelect;
export type InsertLLMAnalyses = typeof llmAnalyses.$inferInsert;

/**
 * Relatórios automáticos
 * Armazena relatórios gerados automaticamente
 */
export const automatedReports = mysqlTable("automated_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  reportType: varchar("reportType", { length: 50 }).notNull(), // "weekly", "monthly"
  reportData: text("reportData").notNull(), // JSON string
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
});

export type AutomatedReports = typeof automatedReports.$inferSelect;
export type InsertAutomatedReports = typeof automatedReports.$inferInsert;


/**
 * Favorite articles saved by users
 */
export const favoriteArticles = mysqlTable("favorite_articles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  pmid: varchar("pmid", { length: 50 }).notNull(),
  title: text("title").notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  url: text("url").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type FavoriteArticle = typeof favoriteArticles.$inferSelect;
export type InsertFavoriteArticle = typeof favoriteArticles.$inferInsert;

/**
 * Search history for users
 */
export const searchHistory = mysqlTable("search_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  query: varchar("query", { length: 255 }).notNull(),
  resultsCount: int("resultsCount").notNull(),
  filters: text("filters"), // JSON string with applied filters
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;


/**
 * Scheduled exports for automated report generation
 * Stores configuration for recurring exports to email or cloud storage
 */
export const scheduledExports = mysqlTable("scheduled_exports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  searchQuery: varchar("searchQuery", { length: 255 }).notNull(),
  filters: text("filters"), // JSON string with search filters
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly (0=Sunday)
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly
  hour: int("hour").default(9), // Hour to run (0-23)
  exportFormat: mysqlEnum("exportFormat", ["csv", "pdf", "both"]).default("csv").notNull(),
  destination: mysqlEnum("destination", ["email", "googleDrive", "oneDrive", "both"]).default("email").notNull(),
  email: varchar("email", { length: 320 }), // Email to send to
  isActive: tinyint("isActive").default(1).notNull(),
  lastRun: timestamp("lastRun"),
  nextRun: timestamp("nextRun"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledExport = typeof scheduledExports.$inferSelect;
export type InsertScheduledExport = typeof scheduledExports.$inferInsert;

/**
 * Cloud storage credentials for users
 * Stores OAuth tokens for Google Drive and OneDrive
 */
export const cloudStorageCredentials = mysqlTable("cloud_storage_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  provider: mysqlEnum("provider", ["googleDrive", "oneDrive"]).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  rootFolderId: varchar("rootFolderId", { length: 255 }), // Folder ID where files are saved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CloudStorageCredential = typeof cloudStorageCredentials.$inferSelect;
export type InsertCloudStorageCredential = typeof cloudStorageCredentials.$inferInsert;

/**
 * Export history tracking
 * Logs all exports for audit and troubleshooting
 */
export const exportHistory = mysqlTable("export_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  scheduledExportId: int("scheduledExportId").references(() => scheduledExports.id),
  searchQuery: varchar("searchQuery", { length: 255 }).notNull(),
  format: mysqlEnum("format", ["csv", "pdf"]).notNull(),
  destination: mysqlEnum("destination", ["email", "googleDrive", "oneDrive"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  fileUrl: text("fileUrl"), // URL to the exported file
  fileSize: int("fileSize"), // Size in bytes
  errorMessage: text("errorMessage"), // Error details if failed
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;


/**
 * Analytics Reports Configuration
 * Stores scheduled reports for the Analytics page
 */
export const analyticsReports = mysqlTable("analytics_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Schedule configuration
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly (0=Sunday)
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly
  hour: int("hour").default(9).notNull(), // 0-23
  minute: int("minute").default(0).notNull(), // 0-59
  
  // Format and destination
  format: mysqlEnum("format", ["csv", "pdf"]).default("pdf").notNull(),
  destination: mysqlEnum("destination", ["email", "googleDrive", "oneDrive"]).default("email").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }), // For email delivery
  
  // Filters
  timeRange: mysqlEnum("timeRange", ["7d", "30d", "90d"]).default("7d").notNull(),
  includeModels: text("includeModels"), // JSON array of model names
  includeCategories: text("includeCategories"), // JSON array of categories
  includeBenchmarks: tinyint("includeBenchmarks").default(1).notNull(), // Include external benchmarks
  
  // Status
  isActive: tinyint("isActive").default(1).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = typeof analyticsReports.$inferInsert;

/**
 * Analytics Report Execution History
 * Tracks each execution of scheduled analytics reports
 */
export const analyticsReportHistory = mysqlTable("analytics_report_history", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull().references(() => analyticsReports.id),
  userId: int("userId").notNull().references(() => users.id),
  
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  fileUrl: text("fileUrl"), // URL to the generated report
  fileSize: int("fileSize"), // Size in bytes
  errorMessage: text("errorMessage"), // Error details if failed
  
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type AnalyticsReportHistory = typeof analyticsReportHistory.$inferSelect;
export type InsertAnalyticsReportHistory = typeof analyticsReportHistory.$inferInsert;


/**
 * ANTIGRAVITY MEDICAL HUB - HEALTH-SPECIFIC TABLES
 * 
 * Extensão do schema para suportar análise de parâmetros de saúde
 * e validação de diagnósticos de IA
 */

/**
 * Parâmetros de Saúde Suportados
 * Define os tipos de parâmetros que podem ser analisados
 */
export const healthParameters = mysqlTable("health_parameters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  parameterName: varchar("parameterName", { length: 255 }).notNull(), // glicose, pressão, colesterol, etc
  parameterType: mysqlEnum("parameterType", ["numeric", "categorical", "boolean"]).notNull(),
  unit: varchar("unit", { length: 50 }), // mg/dL, mmHg, etc
  normalRange: text("normalRange"), // JSON {min, max}
  description: text("description"),
  
  isActive: tinyint("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthParameter = typeof healthParameters.$inferSelect;
export type InsertHealthParameter = typeof healthParameters.$inferInsert;

/**
 * Dados de Saúde do Paciente
 * Armazena valores de parâmetros de saúde para análise
 */
export const patientHealthData = mysqlTable("patient_health_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  parameterId: int("parameterId").notNull().references(() => healthParameters.id),
  
  value: varchar("value", { length: 255 }).notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  source: varchar("source", { length: 100 }), // "manual", "api", "wearable"
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientHealthData = typeof patientHealthData.$inferSelect;
export type InsertPatientHealthData = typeof patientHealthData.$inferInsert;

/**
 * Análises de Saúde
 * Armazena diagnósticos das 6 IAs para cada parâmetro de saúde
 */
export const healthAnalyses = mysqlTable("health_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  healthDataId: int("healthDataId").notNull().references(() => patientHealthData.id),
  
  // Modelo de IA que realizou a análise
  aiModel: varchar("aiModel", { length: 64 }).notNull(), // claude, gpt4, gemini, deepseek, perplexity, grok
  
  // Resultados da análise
  diagnosis: text("diagnosis"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100%
  recommendations: text("recommendations"), // JSON array
  processingTime: int("processingTime"), // ms
  cost: varchar("cost", { length: 32 }),
  tokens: int("tokens"),
  
  // Validação
  isAccurate: tinyint("isAccurate"), // 1=sim, 0=não, null=pendente
  validatedBy: int("validatedBy").references(() => users.id), // médico que validou
  validationNotes: text("validationNotes"),
  validationDate: timestamp("validationDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthAnalysis = typeof healthAnalyses.$inferSelect;
export type InsertHealthAnalysis = typeof healthAnalyses.$inferInsert;

/**
 * Benchmarks de IA para Saúde
 * Armazena métricas de performance das 6 IAs em análise médica
 */
export const aiHealthBenchmarks = mysqlTable("ai_health_benchmarks", {
  id: int("id").autoincrement().primaryKey(),
  
  aiModel: varchar("aiModel", { length: 64 }).notNull().unique(), // claude, gpt4, gemini, deepseek, perplexity, grok
  
  // Métricas de Saúde
  diagnosticAccuracy: decimal("diagnosticAccuracy", { precision: 5, scale: 2 }), // %
  falsePositiveRate: decimal("falsePositiveRate", { precision: 5, scale: 2 }), // %
  falseNegativeRate: decimal("falseNegativeRate", { precision: 5, scale: 2 }), // %
  responseTime: int("responseTime"), // ms
  costPerAnalysis: varchar("costPerAnalysis", { length: 32 }),
  
  // Ranking
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }), // 0-100
  elo: int("elo"), // ELO rating
  rank: int("rank"), // 1-6
  
  // Metadados
  totalAnalyses: int("totalAnalyses").default(0),
  successRate: decimal("successRate", { precision: 5, scale: 2 }), // %
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIHealthBenchmark = typeof aiHealthBenchmarks.$inferSelect;
export type InsertAIHealthBenchmark = typeof aiHealthBenchmarks.$inferInsert;

/**
 * Comparação de Diagnósticos
 * Armazena diagnósticos lado a lado das 6 IAs para validação
 */
export const diagnosisComparison = mysqlTable("diagnosis_comparison", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  healthDataId: int("healthDataId").notNull().references(() => patientHealthData.id),
  
  // Diagnósticos das 6 IAs
  claude_diagnosis: text("claude_diagnosis"),
  gpt4_diagnosis: text("gpt4_diagnosis"),
  gemini_diagnosis: text("gemini_diagnosis"),
  deepseek_diagnosis: text("deepseek_diagnosis"),
  perplexity_diagnosis: text("perplexity_diagnosis"),
  grok_diagnosis: text("grok_diagnosis"),
  
  // Consenso
  consensusDiagnosis: text("consensusDiagnosis"),
  agreementPercentage: decimal("agreementPercentage", { precision: 5, scale: 2 }),
  
  // Validação Médica
  medicalValidation: text("medicalValidation"),
  validatedBy: int("validatedBy").references(() => users.id),
  validationDate: timestamp("validationDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiagnosisComparison = typeof diagnosisComparison.$inferSelect;
export type InsertDiagnosisComparison = typeof diagnosisComparison.$inferInsert;

/**
 * Histórico de Validações
 * Rastreia todas as validações de diagnósticos realizadas
 */
export const validationHistory = mysqlTable("validation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  healthAnalysisId: int("healthAnalysisId").notNull().references(() => healthAnalyses.id),
  
  validatorId: int("validatorId").notNull().references(() => users.id),
  isAccurate: tinyint("isAccurate").notNull(), // 1=correto, 0=incorreto
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ValidationHistory = typeof validationHistory.$inferSelect;
export type InsertValidationHistory = typeof validationHistory.$inferInsert;
