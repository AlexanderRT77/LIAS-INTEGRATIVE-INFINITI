import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createLLMAnalysis,
  getUserLLMAnalyses,
  getUserPreferences,
  createOrUpdateUserPreferences,
  getUserFavoriteAnalyses,
  addFavoriteAnalysis,
  removeFavoriteAnalysis,
  getUserSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  updateSavedFilter,
  getUserAutomatedReports,
  createAutomatedReport,
  markReportAsSent,
} from "./db";

export const llmRouter = router({
  /**
   * Gera um resumo automático de um artigo usando LLM
   */
  summarizeArticle: protectedProcedure
    .input(z.object({
      title: z.string(),
      abstract: z.string(),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const prompt = `Analise o seguinte artigo científico e gere um resumo conciso em português:

Título: ${input.title}
Resumo: ${input.abstract}
${input.content ? `Conteúdo: ${input.content}` : ""}

Por favor, forneça:
1. Um resumo de 2-3 parágrafos
2. Principais conclusões
3. Relevância para análise de modelos de IA`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em análise de artigos científicos e modelos de IA. Forneça análises claras e concisas.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const analysis = response.choices[0]?.message.content || "";

        // Salvar análise no banco de dados
        const saved = await createLLMAnalysis({
          userId: ctx.user.id,
          type: "article_summary",
          inputData: JSON.stringify(input),
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
        });

        return {
          success: true,
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
          savedId: saved?.id,
        };
      } catch (error) {
        console.error("[LLM] Failed to summarize article:", error);
        throw new Error("Falha ao gerar resumo do artigo");
      }
    }),

  /**
   * Gera uma análise comparativa de modelos de IA com critérios customizados
   */
  compareModels: protectedProcedure
    .input(z.object({
      models: z.array(z.object({
        name: z.string(),
        cost: z.number(),
        speed: z.number(),
        accuracy: z.number(),
      })),
      criteria: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const criteria = input.criteria?.join(", ") || "custo, velocidade, acurácia, escalabilidade";

        const modelsData = input.models
          .map(m => `- ${m.name}: Custo: $${m.cost}/1M tokens, Velocidade: ${m.speed} tokens/s, Acurácia: ${m.accuracy}%`)
          .join("\n");

        const prompt = `Analise e compare os seguintes modelos de IA com base nos critérios especificados:

Modelos:
${modelsData}

Critérios de Comparação: ${criteria}

Por favor, forneça:
1. Uma análise comparativa detalhada
2. Recomendações de uso para cada modelo
3. Melhor custo-benefício
4. Melhor para tarefas críticas
5. Melhor para produção em larga escala`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um especialista em modelos de IA e análise de performance. Forneça recomendações práticas e baseadas em dados.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const analysis = response.choices[0]?.message.content || "";

        // Salvar análise no banco de dados
        const saved = await createLLMAnalysis({
          userId: ctx.user.id,
          type: "model_comparison",
          inputData: JSON.stringify(input),
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
        });

        return {
          success: true,
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
          savedId: saved?.id,
        };
      } catch (error) {
        console.error("[LLM] Failed to compare models:", error);
        throw new Error("Falha ao gerar análise comparativa");
      }
    }),

  /**
   * Analisa tendências em dados de performance
   */
  analyzeTrends: protectedProcedure
    .input(z.object({
      dataPoints: z.array(z.object({
        date: z.string(),
        metric: z.string(),
        value: z.number(),
      })),
      metricName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const dataStr = input.dataPoints
          .map(d => `${d.date}: ${d.value}`)
          .join("\n");

        const prompt = `Analise as seguintes tendências de ${input.metricName}:

${dataStr}

Por favor, forneça:
1. Análise da tendência (crescente, decrescente, estável)
2. Padrões identificados
3. Previsão para os próximos períodos
4. Recomendações de ação`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um analista de dados especializado em performance de sistemas e modelos de IA.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const analysis = response.choices[0]?.message.content || "";

        // Salvar análise no banco de dados
        const saved = await createLLMAnalysis({
          userId: ctx.user.id,
          type: "trend_analysis",
          inputData: JSON.stringify(input),
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
        });

        return {
          success: true,
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis),
          savedId: saved?.id,
        };
      } catch (error) {
        console.error("[LLM] Failed to analyze trends:", error);
        throw new Error("Falha ao analisar tendências");
      }
    }),

  /**
   * Obtém histórico de análises LLM do usuário
   */
  getAnalyses: protectedProcedure
    .input(z.object({
      type: z.enum(["article_summary", "model_comparison", "trend_analysis"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await getUserLLMAnalyses(ctx.user.id, input?.type);
    }),
});

export const preferencesRouter = router({
  /**
   * Obtém preferências do usuário
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    return await getUserPreferences(ctx.user.id);
  }),

  /**
   * Atualiza preferências do usuário
   */
  update: protectedProcedure
    .input(z.object({
      theme: z.string().optional(),
      defaultFilters: z.string().optional(),
      favoriteModels: z.string().optional(),
      notificationsEnabled: z.number().optional(),
      autoReportFrequency: z.enum(["daily", "weekly", "monthly"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createOrUpdateUserPreferences({
        userId: ctx.user.id,
        ...input,
      });
    }),
});

export const favoritesRouter = router({
  /**
   * Obtém lista de IDs de análises favoritas
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserFavoriteAnalyses(ctx.user.id);
  }),

  /**
   * Adiciona uma análise aos favoritos
   */
  add: protectedProcedure
    .input(z.object({
      analysisId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await addFavoriteAnalysis(ctx.user.id, input.analysisId);
      return { success };
    }),

  /**
   * Remove uma análise dos favoritos
   */
  remove: protectedProcedure
    .input(z.object({
      analysisId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await removeFavoriteAnalysis(ctx.user.id, input.analysisId);
      return { success };
    }),
});

export const filtersRouter = router({
  /**
   * Obtém filtros salvos do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserSavedFilters(ctx.user.id);
  }),

  /**
   * Cria um novo filtro salvo
   */
  create: protectedProcedure
    .input(z.object({
      filterName: z.string(),
      filterConfig: z.string(),
      isDefault: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createSavedFilter({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Atualiza um filtro salvo
   */
  update: protectedProcedure
    .input(z.object({
      filterId: z.number(),
      filterName: z.string().optional(),
      filterConfig: z.string().optional(),
      isDefault: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await updateSavedFilter(input.filterId, {
        filterName: input.filterName,
        filterConfig: input.filterConfig,
        isDefault: input.isDefault,
      });
      return { success };
    }),

  /**
   * Deleta um filtro salvo
   */
  delete: protectedProcedure
    .input(z.object({
      filterId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteSavedFilter(input.filterId);
      return { success };
    }),
});

export const reportsRouter = router({
  /**
   * Obtém relatórios automáticos do usuário
   */
  list: protectedProcedure
    .input(z.object({
      reportType: z.enum(["weekly", "monthly"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await getUserAutomatedReports(ctx.user.id, input?.reportType);
    }),

  /**
   * Cria um novo relatório automático
   */
  create: protectedProcedure
    .input(z.object({
      reportType: z.enum(["weekly", "monthly"]),
      reportData: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await createAutomatedReport({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Marca um relatório como enviado
   */
  markAsSent: protectedProcedure
    .input(z.object({
      reportId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const success = await markReportAsSent(input.reportId);
      return { success };
    }),
});
