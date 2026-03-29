import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, logs, InsertLog, Log, analyses, InsertAnalysis, Analysis, analysisResponses, InsertAnalysisResponse, AnalysisResponse, auditLog, InsertAuditLog, teamMembers, InsertTeamMember, TeamMember, userPreferences, InsertUserPreferences, UserPreferences, favoriteAnalyses, InsertFavoriteAnalyses, savedFilters, InsertSavedFilters, SavedFilters, llmAnalyses, InsertLLMAnalyses, LLMAnalyses, automatedReports, InsertAutomatedReports, AutomatedReports, favoriteArticles, InsertFavoriteArticle, FavoriteArticle, searchHistory, InsertSearchHistory, SearchHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLog(log: InsertLog): Promise<Log | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create log: database not available");
    return null;
  }

  try {
    await db.insert(logs).values(log);
    return null;
  } catch (error) {
    console.error("[Database] Failed to create log:", error);
    return null;
  }
}

export async function getUserLogs(userId: number, limit: number = 100, offset: number = 0): Promise<Log[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get logs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(logs)
      .where(eq(logs.userId, userId))
      .orderBy(desc(logs.timestamp))
      .limit(limit)
      .offset(offset);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get logs:", error);
    return [];
  }
}

export async function getLogsByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Log[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get logs: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(logs)
      .where(
        and(
          eq(logs.userId, userId),
          gte(logs.timestamp, startDate),
          lte(logs.timestamp, endDate)
        )
      )
      .orderBy(desc(logs.timestamp));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get logs by date range:", error);
    return [];
  }
}

export async function getLogStats(userId: number): Promise<{
  totalLogs: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  avgConfidence: number;
} | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get log stats: database not available");
    return null;
  }

  try {
    const userLogs = await db.select().from(logs).where(eq(logs.userId, userId));
    
    if (userLogs.length === 0) {
      return {
        totalLogs: 0,
        totalTokens: 0,
        totalCost: 0,
        avgLatency: 0,
        avgConfidence: 0,
      };
    }

    const totalTokens = userLogs.reduce((sum, log) => sum + log.tokens, 0);
    const totalCost = userLogs.reduce((sum, log) => sum + parseFloat(log.custo), 0);
    const avgLatency = userLogs.reduce((sum, log) => sum + log.latencia, 0) / userLogs.length;
    const avgConfidence = userLogs.reduce((sum, log) => sum + parseFloat(log.confianca), 0) / userLogs.length;

    return {
      totalLogs: userLogs.length,
      totalTokens,
      totalCost,
      avgLatency,
      avgConfidence,
    };
  } catch (error) {
    console.error("[Database] Failed to get log stats:", error);
    return null;
  }
}

// ============================================================================
// ANÁLISES COLABORATIVAS
// ============================================================================

export async function createAnalysis(analysis: InsertAnalysis): Promise<Analysis | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(analyses).values(analysis);
    const created = await db.select().from(analyses).where(eq(analyses.id, result[0].insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create analysis:", error);
    return null;
  }
}

export async function getAnalysisByIdWithResponses(analysisId: number): Promise<(Analysis & { responses: AnalysisResponse[] }) | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const analysis = await db.select().from(analyses).where(eq(analyses.id, analysisId)).limit(1);
    if (analysis.length === 0) return null;

    const responses = await db.select().from(analysisResponses).where(eq(analysisResponses.analysisId, analysisId));
    return { ...analysis[0], responses };
  } catch (error) {
    console.error("[Database] Failed to get analysis:", error);
    return null;
  }
}

export async function updateAnalysisResponse(responseId: number, updates: Partial<AnalysisResponse>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(analysisResponses).set(updates).where(eq(analysisResponses.id, responseId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update response:", error);
    return false;
  }
}

export async function createAnalysisResponse(response: InsertAnalysisResponse): Promise<AnalysisResponse | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(analysisResponses).values(response);
    const created = await db.select().from(analysisResponses).where(eq(analysisResponses.id, result[0].insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create response:", error);
    return null;
  }
}

export async function getAnalysesByTeam(teamId: number): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(analyses).where(eq(analyses.teamId, teamId)).orderBy(desc(analyses.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get team analyses:", error);
    return [];
  }
}

export async function logAuditChange(auditEntry: InsertAuditLog): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(auditLog).values(auditEntry);
    return true;
  } catch (error) {
    console.error("[Database] Failed to log audit:", error);
    return false;
  }
}

export async function addTeamMember(member: InsertTeamMember): Promise<TeamMember | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(teamMembers).values(member);
    const created = await db.select().from(teamMembers).where(eq(teamMembers.id, result[0].insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to add team member:", error);
    return null;
  }
}

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  } catch (error) {
    console.error("[Database] Failed to get team members:", error);
    return [];
  }
}

export async function deleteAnalysisResponse(responseId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(analysisResponses).where(eq(analysisResponses.id, responseId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete response:", error);
    return false;
  }
}

export async function getAllAnalyses(limit: number = 100, offset: number = 0): Promise<Analysis[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(analyses).orderBy(desc(analyses.createdAt)).limit(limit).offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get analyses:", error);
    return [];
  }
}


// ============================================================================
// PREFERÊNCIAS DE USUÁRIO
// ============================================================================

export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get user preferences:", error);
    return null;
  }
}

export async function createOrUpdateUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const existing = await getUserPreferences(prefs.userId!);
    if (existing) {
      // Only update provided fields
      const updateData: any = {};
      if (prefs.theme !== undefined) updateData.theme = prefs.theme;
      if (prefs.defaultFilters !== undefined) updateData.defaultFilters = prefs.defaultFilters;
      if (prefs.favoriteModels !== undefined) updateData.favoriteModels = prefs.favoriteModels;
      if (prefs.notificationsEnabled !== undefined) updateData.notificationsEnabled = prefs.notificationsEnabled;
      if (prefs.autoReportFrequency !== undefined) updateData.autoReportFrequency = prefs.autoReportFrequency;
      
      if (Object.keys(updateData).length > 0) {
        await db.update(userPreferences).set(updateData).where(eq(userPreferences.userId, prefs.userId!));
      }
    } else {
      await db.insert(userPreferences).values(prefs);
    }
    return await getUserPreferences(prefs.userId!);
  } catch (error) {
    console.error("[Database] Failed to create/update user preferences:", error);
    return null;
  }
}

// ============================================================================
// ANÁLISES FAVORITAS
// ============================================================================

export async function addFavoriteAnalysis(userId: number, analysisId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(favoriteAnalyses).values({ userId, analysisId });
    return true;
  } catch (error) {
    console.error("[Database] Failed to add favorite analysis:", error);
    return false;
  }
}

export async function removeFavoriteAnalysis(userId: number, analysisId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(favoriteAnalyses).where(
      and(
        eq(favoriteAnalyses.userId, userId),
        eq(favoriteAnalyses.analysisId, analysisId)
      )
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite analysis:", error);
    return false;
  }
}

export async function getUserFavoriteAnalyses(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(favoriteAnalyses).where(eq(favoriteAnalyses.userId, userId));
    return result.map(f => f.analysisId);
  } catch (error) {
    console.error("[Database] Failed to get favorite analyses:", error);
    return [];
  }
}

// ============================================================================
// FILTROS SALVOS
// ============================================================================

export async function createSavedFilter(filter: InsertSavedFilters): Promise<SavedFilters | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(savedFilters).values(filter);
    const insertId = (result[0] as any)?.insertId;
    if (!insertId) return null;
    const created = await db.select().from(savedFilters).where(eq(savedFilters.id, insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create saved filter:", error);
    return null;
  }
}

export async function getUserSavedFilters(userId: number): Promise<SavedFilters[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(savedFilters).where(eq(savedFilters.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get saved filters:", error);
    return [];
  }
}

export async function deleteSavedFilter(filterId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(savedFilters).where(eq(savedFilters.id, filterId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete saved filter:", error);
    return false;
  }
}

export async function updateSavedFilter(filterId: number, updates: Partial<SavedFilters>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(savedFilters).set(updates).where(eq(savedFilters.id, filterId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update saved filter:", error);
    return false;
  }
}

// ============================================================================
// ANÁLISES GERADAS POR LLM
// ============================================================================

export async function createLLMAnalysis(analysis: InsertLLMAnalyses): Promise<LLMAnalyses | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(llmAnalyses).values(analysis);
    const insertId = (result[0] as any)?.insertId;
    if (!insertId) return null;
    const created = await db.select().from(llmAnalyses).where(eq(llmAnalyses.id, insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create LLM analysis:", error);
    return null;
  }
}

export async function getUserLLMAnalyses(userId: number, type?: string): Promise<LLMAnalyses[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    if (type) {
      return await db.select().from(llmAnalyses).where(
        and(
          eq(llmAnalyses.userId, userId),
          eq(llmAnalyses.type, type)
        )
      ).orderBy(desc(llmAnalyses.createdAt));
    } else {
      return await db.select().from(llmAnalyses).where(eq(llmAnalyses.userId, userId)).orderBy(desc(llmAnalyses.createdAt));
    }
  } catch (error) {
    console.error("[Database] Failed to get LLM analyses:", error);
    return [];
  }
}

// ============================================================================
// RELATÓRIOS AUTOMÁTICOS
// ============================================================================

export async function createAutomatedReport(report: InsertAutomatedReports): Promise<AutomatedReports | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(automatedReports).values(report);
    const insertId = (result[0] as any)?.insertId;
    if (!insertId) return null;
    const created = await db.select().from(automatedReports).where(eq(automatedReports.id, insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create automated report:", error);
    return null;
  }
}

export async function getUserAutomatedReports(userId: number, reportType?: string): Promise<AutomatedReports[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    if (reportType) {
      return await db.select().from(automatedReports).where(
        and(
          eq(automatedReports.userId, userId),
          eq(automatedReports.reportType, reportType)
        )
      ).orderBy(desc(automatedReports.generatedAt));
    } else {
      return await db.select().from(automatedReports).where(eq(automatedReports.userId, userId)).orderBy(desc(automatedReports.generatedAt));
    }
  } catch (error) {
    console.error("[Database] Failed to get automated reports:", error);
    return [];
  }
}

export async function markReportAsSent(reportId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(automatedReports).set({ sentAt: new Date() }).where(eq(automatedReports.id, reportId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to mark report as sent:", error);
    return false;
  }
}


/**
 * Favorite Articles Functions
 */
export async function addFavoriteArticle(article: InsertFavoriteArticle): Promise<FavoriteArticle | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(favoriteArticles).values(article);
    const insertId = (result[0] as any)?.insertId;
    if (!insertId) return null;
    const created = await db.select().from(favoriteArticles).where(eq(favoriteArticles.id, insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to add favorite article:", error);
    return null;
  }
}

export async function removeFavoriteArticle(userId: number, pmid: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(favoriteArticles).where(
      and(
        eq(favoriteArticles.userId, userId),
        eq(favoriteArticles.pmid, pmid)
      )
    );
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove favorite article:", error);
    return false;
  }
}

export async function getUserFavoriteArticles(userId: number): Promise<FavoriteArticle[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(favoriteArticles)
      .where(eq(favoriteArticles.userId, userId))
      .orderBy(desc(favoriteArticles.addedAt));
  } catch (error) {
    console.error("[Database] Failed to get favorite articles:", error);
    return [];
  }
}

export async function isFavoriteArticle(userId: number, pmid: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select().from(favoriteArticles)
      .where(
        and(
          eq(favoriteArticles.userId, userId),
          eq(favoriteArticles.pmid, pmid)
        )
      )
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check favorite article:", error);
    return false;
  }
}

/**
 * Search History Functions
 */
export async function saveSearchHistory(search: InsertSearchHistory): Promise<SearchHistory | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(searchHistory).values(search);
    const insertId = (result[0] as any)?.insertId;
    if (!insertId) return null;
    const created = await db.select().from(searchHistory).where(eq(searchHistory.id, insertId)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Database] Failed to save search history:", error);
    return null;
  }
}

export async function getUserSearchHistory(userId: number, limit = 20): Promise<SearchHistory[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get search history:", error);
    return [];
  }
}

export async function getRecentSearches(userId: number, days = 7): Promise<SearchHistory[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await db.select().from(searchHistory)
      .where(
        and(
          eq(searchHistory.userId, userId),
          gte(searchHistory.searchedAt, dateFrom)
        )
      )
      .orderBy(desc(searchHistory.searchedAt));
  } catch (error) {
    console.error("[Database] Failed to get recent searches:", error);
    return [];
  }
}
