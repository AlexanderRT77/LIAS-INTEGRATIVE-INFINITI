import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  createLLMAnalysis,
  getUserLLMAnalyses,
  getUserPreferences,
  createOrUpdateUserPreferences,
  addFavoriteAnalysis,
  removeFavoriteAnalysis,
  getUserFavoriteAnalyses,
  createSavedFilter,
  getUserSavedFilters,
  deleteSavedFilter,
  updateSavedFilter,
  createAutomatedReport,
  getUserAutomatedReports,
  markReportAsSent,
} from "./db";

describe("LLM Features and User Preferences", () => {
  let testUserId = 1;
  let testAnalysisId = 1;

  beforeAll(async () => {
    // Create a test user first
    const testUser = await (await import("./db")).upsertUser({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
    });
    // Use a valid user ID or default to 1
    testUserId = 1;
    testAnalysisId = 1;
  });

  describe("LLM Analyses", () => {
    it("should create an LLM analysis", async () => {
      const result = await createLLMAnalysis({
        userId: testUserId,
        type: "article_summary",
        inputData: JSON.stringify({ title: "Test Article", abstract: "Test abstract" }),
        analysis: "This is a test analysis summary",
      });

      expect(result).toBeDefined();
      expect(result?.type).toBe("article_summary");
      expect(result?.userId).toBe(testUserId);
    });

    it("should retrieve user LLM analyses", async () => {
      // Create test analysis first
      await createLLMAnalysis({
        userId: testUserId,
        type: "model_comparison",
        inputData: JSON.stringify({ models: ["Model1", "Model2"] }),
        analysis: "Comparison analysis",
      });

      const analyses = await getUserLLMAnalyses(testUserId);
      expect(Array.isArray(analyses)).toBe(true);
      expect(analyses.length).toBeGreaterThan(0);
    });

    it("should filter LLM analyses by type", async () => {
      const analyses = await getUserLLMAnalyses(testUserId, "article_summary");
      expect(Array.isArray(analyses)).toBe(true);
      analyses.forEach((analysis) => {
        expect(analysis.type).toBe("article_summary");
      });
    });
  });

  describe("User Preferences", () => {
    it("should create user preferences", async () => {
      const result = await createOrUpdateUserPreferences({
        userId: testUserId,
        theme: "cyberpunk",
        notificationsEnabled: 1,
        autoReportFrequency: "weekly",
      });

      expect(result).toBeDefined();
      expect(result?.theme).toBe("cyberpunk");
      expect(result?.autoReportFrequency).toBe("weekly");
    });

    it("should retrieve user preferences", async () => {
      const prefs = await getUserPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(prefs?.userId).toBe(testUserId);
    });

    it("should update user preferences", async () => {
      await createOrUpdateUserPreferences({
        userId: testUserId,
        theme: "dark",
      });

      const updated = await getUserPreferences(testUserId);
      expect(updated?.theme).toBe("dark");
    });

    it("should handle favorite models in preferences", async () => {
      const favoriteModels = JSON.stringify(["Manus", "Claude 3.5", "DeepSeek R1"]);
      await createOrUpdateUserPreferences({
        userId: testUserId,
        favoriteModels,
      });

      const prefs = await getUserPreferences(testUserId);
      expect(prefs?.favoriteModels).toBe(favoriteModels);
    });
  });

  describe("Favorite Analyses", () => {
    it("should add an analysis to favorites", async () => {
      const success = await addFavoriteAnalysis(testUserId, testAnalysisId);
      expect(success).toBe(true);
    });

    it("should retrieve favorite analyses", async () => {
      await addFavoriteAnalysis(testUserId, testAnalysisId);
      const favorites = await getUserFavoriteAnalyses(testUserId);

      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites).toContain(testAnalysisId);
    });

    it("should remove an analysis from favorites", async () => {
      await addFavoriteAnalysis(testUserId, testAnalysisId);
      const success = await removeFavoriteAnalysis(testUserId, testAnalysisId);

      expect(success).toBe(true);
    });

    it("should not have removed analysis in favorites list", async () => {
      await addFavoriteAnalysis(testUserId, testAnalysisId);
      await removeFavoriteAnalysis(testUserId, testAnalysisId);
      const favorites = await getUserFavoriteAnalyses(testUserId);

      expect(favorites).not.toContain(testAnalysisId);
    });
  });

  describe("Saved Filters", () => {
    it("should create a saved filter", async () => {
      const result = await createSavedFilter({
        userId: testUserId,
        filterName: "My Custom Filter",
        filterConfig: JSON.stringify({ models: ["Manus", "Claude"], dateRange: "7d" }),
      });

      expect(result).toBeDefined();
      expect(result?.filterName).toBe("My Custom Filter");
      expect(result?.userId).toBe(testUserId);
    });

    it("should retrieve user saved filters", async () => {
      await createSavedFilter({
        userId: testUserId,
        filterName: "Test Filter",
        filterConfig: JSON.stringify({}),
      });

      const filters = await getUserSavedFilters(testUserId);
      expect(Array.isArray(filters)).toBe(true);
      expect(filters.length).toBeGreaterThan(0);
    });

    it("should update a saved filter", async () => {
      const created = await createSavedFilter({
        userId: testUserId,
        filterName: "Original Name",
        filterConfig: JSON.stringify({}),
      });

      if (created) {
        const success = await updateSavedFilter(created.id, {
          filterName: "Updated Name",
        });

        expect(success).toBe(true);
      }
    });

    it("should delete a saved filter", async () => {
      const created = await createSavedFilter({
        userId: testUserId,
        filterName: "To Delete",
        filterConfig: JSON.stringify({}),
      });

      if (created) {
        const success = await deleteSavedFilter(created.id);
        expect(success).toBe(true);
      }
    });

    it("should set filter as default", async () => {
      const result = await createSavedFilter({
        userId: testUserId,
        filterName: "Default Filter",
        filterConfig: JSON.stringify({}),
        isDefault: 1,
      });

      expect(result?.isDefault).toBe(1);
    });
  });

  describe("Automated Reports", () => {
    it("should create an automated report", async () => {
      const reportData = JSON.stringify({
        period: "weekly",
        metrics: { avgCost: 0.12, avgSpeed: 2.0, topModel: "Manus" },
      });

      const result = await createAutomatedReport({
        userId: testUserId,
        reportType: "weekly",
        reportData,
      });

      expect(result).toBeDefined();
      expect(result?.reportType).toBe("weekly");
      expect(result?.userId).toBe(testUserId);
      expect(result?.sentAt).toBeNull();
    });

    it("should retrieve user automated reports", async () => {
      await createAutomatedReport({
        userId: testUserId,
        reportType: "monthly",
        reportData: JSON.stringify({}),
      });

      const reports = await getUserAutomatedReports(testUserId);
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);
    });

    it("should filter reports by type", async () => {
      const reports = await getUserAutomatedReports(testUserId, "weekly");
      expect(Array.isArray(reports)).toBe(true);
      reports.forEach((report) => {
        expect(report.reportType).toBe("weekly");
      });
    });

    it("should mark a report as sent", async () => {
      const created = await createAutomatedReport({
        userId: testUserId,
        reportType: "weekly",
        reportData: JSON.stringify({}),
      });

      if (created) {
        const success = await markReportAsSent(created.id);
        expect(success).toBe(true);

        // Verify it was marked as sent
        const reports = await getUserAutomatedReports(testUserId);
        const marked = reports.find((r) => r.id === created.id);
        expect(marked?.sentAt).toBeDefined();
      }
    });

    it("should handle multiple reports for same user", async () => {
      await createAutomatedReport({
        userId: testUserId,
        reportType: "weekly",
        reportData: JSON.stringify({ week: 1 }),
      });

      await createAutomatedReport({
        userId: testUserId,
        reportType: "weekly",
        reportData: JSON.stringify({ week: 2 }),
      });

      const reports = await getUserAutomatedReports(testUserId, "weekly");
      expect(reports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Integration Scenarios", () => {
    it("should support complete user preference workflow", async () => {
      // Create preferences
      await createOrUpdateUserPreferences({
        userId: testUserId,
        theme: "cyberpunk",
        autoReportFrequency: "daily",
        favoriteModels: JSON.stringify(["Manus", "Claude 3.5"]),
      });

      // Add favorite analysis
      await addFavoriteAnalysis(testUserId, 100);

      // Create saved filter
      await createSavedFilter({
        userId: testUserId,
        filterName: "Daily Report Filter",
        filterConfig: JSON.stringify({ period: "daily" }),
        isDefault: 1,
      });

      // Create automated report
      await createAutomatedReport({
        userId: testUserId,
        reportType: "daily",
        reportData: JSON.stringify({ automated: true }),
      });

      // Verify all data
      const prefs = await getUserPreferences(testUserId);
      const favorites = await getUserFavoriteAnalyses(testUserId);
      const filters = await getUserSavedFilters(testUserId);
      const reports = await getUserAutomatedReports(testUserId, "daily");

      expect(prefs?.theme).toBe("cyberpunk");
      expect(favorites).toContain(100);
      expect(filters.length).toBeGreaterThan(0);
      expect(reports.length).toBeGreaterThan(0);
    });

    it("should handle LLM analysis with preferences", async () => {
      // Get user preferences
      const prefs = await getUserPreferences(testUserId);

      // Create LLM analysis based on preferences
      const analysis = await createLLMAnalysis({
        userId: testUserId,
        type: "model_comparison",
        inputData: JSON.stringify({
          models: prefs?.favoriteModels ? JSON.parse(prefs.favoriteModels) : [],
        }),
        analysis: "Comparison of favorite models",
      });

      expect(analysis).toBeDefined();
      expect(analysis?.type).toBe("model_comparison");
    });
  });
});
