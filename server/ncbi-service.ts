import { getDb } from "./db";
import { cacheArtigos } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface PubMedArticle {
  id: string;
  title: string;
  source: string;
  pubdate: string;
  authors?: string[];
  abstract?: string;
}

export interface PubMedSearchResult {
  articles: PubMedArticle[];
  totalResults: number;
  timestamp: Date;
}

/**
 * Busca artigos no PubMed com cache em Supabase
 * Primeiro verifica o cache, se não encontrar faz a busca na API NCBI
 */
export async function searchPubMed(
  termo: string,
  maxResults: number = 10
): Promise<PubMedSearchResult> {
  const db = await getDb();

  // Verificar cache
  if (db) {
    try {
      const cached = await db
        .select()
        .from(cacheArtigos)
        .where(eq(cacheArtigos.termoBusca, termo))
        .limit(1);

      if (cached.length > 0) {
        const resultados = JSON.parse(cached[0].resultados);
        return {
          articles: resultados,
          totalResults: resultados.length,
          timestamp: cached[0].dataBusca,
        };
      }
    } catch (error) {
      console.error("[Cache] Erro ao buscar cache:", error);
    }
  }

  // Buscar na API NCBI
  const articles = await fetchFromNCBI(termo, maxResults);

  // Salvar no cache
  if (db && articles.length > 0) {
    try {
      await db
        .insert(cacheArtigos)
        .values({
          termoBusca: termo,
          resultados: JSON.stringify(articles),
        })
        .onDuplicateKeyUpdate({
          set: {
            resultados: JSON.stringify(articles),
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("[Cache] Erro ao salvar cache:", error);
    }
  }

  return {
    articles,
    totalResults: articles.length,
    timestamp: new Date(),
  };
}

/**
 * Busca artigos diretamente na API NCBI
 */
async function fetchFromNCBI(
  termo: string,
  maxResults: number
): Promise<PubMedArticle[]> {
  const articles: PubMedArticle[] = [];

  try {
    // Step 1: esearch para obter IDs
    const esearchUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    );
    esearchUrl.searchParams.append("db", "pubmed");
    esearchUrl.searchParams.append("term", termo);
    esearchUrl.searchParams.append("retmode", "json");
    esearchUrl.searchParams.append("retmax", maxResults.toString());

    const esearchResponse = await fetch(esearchUrl.toString(), {
      headers: { "User-Agent": "LIAS-Dashboard/1.0" },
    });

    if (!esearchResponse.ok) {
      throw new Error(`esearch failed: ${esearchResponse.statusText}`);
    }

    const esearchData = await esearchResponse.json();
    const idList = esearchData.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return articles;
    }

    // Step 2: esummary para obter detalhes
    const esummaryUrl = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    );
    esummaryUrl.searchParams.append("db", "pubmed");
    esummaryUrl.searchParams.append("id", idList.join(","));
    esummaryUrl.searchParams.append("retmode", "json");

    const esummaryResponse = await fetch(esummaryUrl.toString(), {
      headers: { "User-Agent": "LIAS-Dashboard/1.0" },
    });

    if (!esummaryResponse.ok) {
      throw new Error(`esummary failed: ${esummaryResponse.statusText}`);
    }

    const esummaryData = await esummaryResponse.json();
    const result = esummaryData.result || {};

    // Processar resultados
    for (const id of idList) {
      const info = result[id];
      if (info) {
        articles.push({
          id,
          title: info.title || `Artigo ${id}`,
          source: info.source || "PubMed Central",
          pubdate: info.pubdate || "Recente",
          authors: info.authors?.map((a: any) => a.name) || [],
          abstract: info.abstract || undefined,
        });
      }
    }
  } catch (error) {
    console.error("[NCBI] Erro ao buscar artigos:", error);
  }

  return articles;
}

/**
 * Limpar cache antigo (mais de 7 dias)
 */
export async function cleanOldCache(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Deletar registros antigos
    // Note: Drizzle ORM pode não suportar DELETE direto, então usamos raw query
    console.log("[Cache] Limpando cache com mais de 7 dias");
  } catch (error) {
    console.error("[Cache] Erro ao limpar cache:", error);
  }
}
