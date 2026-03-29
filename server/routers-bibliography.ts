import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { searchPubMed, getPubMedUrl } from "./pubmed";
import {
  addFavoriteArticle,
  removeFavoriteArticle,
  getUserFavoriteArticles,
  isFavoriteArticle,
  saveSearchHistory,
  getUserSearchHistory,
} from "./db";
import { exportToCSV, exportToPDF, generateExportFilename, type ArticleForExport } from "./export";

export const bibliographyRouter = router({
  /**
   * Search PubMed for articles with pagination and filters
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required").max(200),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(50).default(10),
        minYear: z.number().min(1900).optional(),
        maxYear: z.number().max(2100).optional(),
        journal: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const maxResults = input.page * input.pageSize;
        const articles = await searchPubMed(input.query, Math.min(maxResults, 100));

        let filtered = articles;

        if (input.minYear || input.maxYear) {
          filtered = filtered.filter((article) => {
            const year = parseInt(article.pubdate.split("-")[0]);
            if (input.minYear && year < input.minYear) return false;
            if (input.maxYear && year > input.maxYear) return false;
            return true;
          });
        }

        if (input.journal) {
          filtered = filtered.filter((article) =>
            article.source.toLowerCase().includes(input.journal!.toLowerCase())
          );
        }

        const start = (input.page - 1) * input.pageSize;
        const end = start + input.pageSize;
        const paginated = filtered.slice(start, end);

        return {
          success: true,
          query: input.query,
          page: input.page,
          pageSize: input.pageSize,
          totalResults: filtered.length,
          totalPages: Math.ceil(filtered.length / input.pageSize),
          articles: paginated.map((article) => ({
            id: article.pmid,
            title: article.title,
            authors: article.authors,
            source: article.source,
            pubdate: article.pubdate,
            abstract: article.abstract,
            url: getPubMedUrl(article.pmid),
          })),
        };
      } catch (error) {
        console.error("[Bibliography Router] Search error:", error);
        return {
          success: false,
          query: input.query,
          page: input.page,
          pageSize: input.pageSize,
          totalResults: 0,
          totalPages: 0,
          articles: [],
          error: "Failed to search PubMed",
        };
      }
    }),

  /**
   * Get a single article details by PMID
   */
  getArticle: publicProcedure
    .input(
      z.object({
        pmid: z.string().regex(/^\d+$/, "Invalid PMID format"),
      })
    )
    .query(async ({ input }) => {
      try {
        return {
          success: true,
          pmid: input.pmid,
          url: getPubMedUrl(input.pmid),
        };
      } catch (error) {
        console.error("[Bibliography Router] Get article error:", error);
        return {
          success: false,
          error: "Failed to retrieve article",
        };
      }
    }),

  /**
   * Get suggested search terms
   */
  getSuggestions: publicProcedure.query(async () => {
    const suggestions = [
      "Diabetes",
      "Cancer",
      "Artificial Intelligence in Medicine",
      "Machine Learning",
      "Deep Learning",
      "Medical Imaging",
      "COVID-19",
      "Hypertension",
      "Alzheimer's Disease",
      "Cardiovascular Disease",
      "Gene Therapy",
      "Immunotherapy",
      "Precision Medicine",
      "Telemedicine",
      "Blockchain in Healthcare",
    ];

    return {
      success: true,
      suggestions,
    };
  }),

  /**
   * Save article to favorites
   */
  addFavorite: protectedProcedure
    .input(
      z.object({
        pmid: z.string(),
        title: z.string(),
        source: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          return { success: false, error: "User not authenticated" };
        }

        const isFav = await isFavoriteArticle(ctx.user.id, input.pmid);
        if (isFav) {
          return { success: false, error: "Article already in favorites" };
        }

        const result = await addFavoriteArticle({
          userId: ctx.user.id,
          pmid: input.pmid,
          title: input.title,
          source: input.source,
          url: input.url,
        });

        if (!result) {
          return { success: false, error: "Failed to add favorite" };
        }

        return {
          success: true,
          message: "Article added to favorites",
          favorite: result,
        };
      } catch (error) {
        console.error("[Bibliography Router] Add favorite error:", error);
        return {
          success: false,
          error: "Failed to add favorite",
        };
      }
    }),

  /**
   * Remove article from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({ pmid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          return { success: false, error: "User not authenticated" };
        }

        const result = await removeFavoriteArticle(ctx.user.id, input.pmid);

        return {
          success: result,
          message: result ? "Article removed from favorites" : "Failed to remove favorite",
        };
      } catch (error) {
        console.error("[Bibliography Router] Remove favorite error:", error);
        return {
          success: false,
          error: "Failed to remove favorite",
        };
      }
    }),

  /**
   * Get user's favorite articles
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: "User not authenticated",
          favorites: [],
        };
      }

      const favorites = await getUserFavoriteArticles(ctx.user.id);

      return {
        success: true,
        favorites: favorites.map((fav) => ({
          id: fav.pmid,
          title: fav.title,
          source: fav.source,
          url: fav.url,
          addedAt: fav.addedAt,
        })),
      };
    } catch (error) {
      console.error("[Bibliography Router] Get favorites error:", error);
      return {
        success: false,
        error: "Failed to retrieve favorites",
        favorites: [],
      };
    }
  }),

  /**
   * Save search to history
   */
  saveSearchHistory: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        resultsCount: z.number(),
        filters: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          return { success: false, error: "User not authenticated" };
        }

        const result = await saveSearchHistory({
          userId: ctx.user.id,
          query: input.query,
          resultsCount: input.resultsCount,
          filters: input.filters ? JSON.stringify(input.filters) : null,
        });

        return {
          success: !!result,
          message: result ? "Search saved to history" : "Failed to save search",
        };
      } catch (error) {
        console.error("[Bibliography Router] Save search history error:", error);
        return {
          success: false,
          error: "Failed to save search history",
        };
      }
    }),

  /**
   * Get user's search history
   */
  getSearchHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        return {
          success: false,
          error: "User not authenticated",
          history: [],
        };
      }

      const history = await getUserSearchHistory(ctx.user.id, 20);

      return {
        success: true,
        history: history.map((h) => ({
          query: h.query,
          resultsCount: h.resultsCount,
          searchedAt: h.searchedAt,
          filters: h.filters ? JSON.parse(h.filters) : null,
        })),
      };
    } catch (error) {
      console.error("[Bibliography Router] Get search history error:", error);
      return {
        success: false,
        error: "Failed to retrieve search history",
        history: [],
      };
    }
  }),

  /**
   * Export search results to CSV
   */
  exportToCSV: publicProcedure
    .input(
      z.object({
        query: z.string(),
        articles: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()).optional(),
            source: z.string(),
            pubdate: z.string(),
            abstract: z.string().optional(),
            url: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = exportToCSV(input.articles as ArticleForExport[], input.query);
        const filename = generateExportFilename(input.query, "csv");

        return {
          success: true,
          filename,
          data: csv,
          mimeType: "text/csv",
        };
      } catch (error) {
        console.error("[Bibliography Router] Export to CSV error:", error);
        return {
          success: false,
          error: "Failed to export to CSV",
        };
      }
    }),

  /**
   * Export search results to PDF
   */
  exportToPDF: publicProcedure
    .input(
      z.object({
        query: z.string(),
        articles: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            authors: z.array(z.string()).optional(),
            source: z.string(),
            pubdate: z.string(),
            abstract: z.string().optional(),
            url: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = await exportToPDF(input.articles as ArticleForExport[], input.query);
        const filename = generateExportFilename(input.query, "pdf");

        // Convert buffer to base64 for transmission
        const base64Data = buffer.toString("base64");

        return {
          success: true,
          filename,
          data: base64Data,
          mimeType: "application/pdf",
        };
      } catch (error) {
        console.error("[Bibliography Router] Export to PDF error:", error);
        return {
          success: false,
          error: "Failed to export to PDF",
        };
      }
    }),
});
