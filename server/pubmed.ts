import { getDb } from "./db";
import { cacheArtigos } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const NCBI_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const NCBI_API_KEY = process.env.NCBI_API_KEY || "";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  source: string;
  pubdate: string;
  abstract: string;
  url: string;
}

/**
 * Search PubMed using NCBI E-utilities API
 * Returns article metadata with valid PubMed links
 */
export async function searchPubMed(query: string, maxResults = 10): Promise<PubMedArticle[]> {
  try {
    // Check cache first
    const cached = await getCachedArticles(query);
    if (cached.length > 0) {
      console.log(`[PubMed] Found ${cached.length} cached articles for "${query}"`);
      return cached;
    }

    // Step 1: Search for PMIDs using esearch
    const searchUrl = new URL(`${NCBI_BASE_URL}/esearch.fcgi`);
    searchUrl.searchParams.append("db", "pubmed");
    searchUrl.searchParams.append("term", query);
    searchUrl.searchParams.append("retmax", maxResults.toString());
    searchUrl.searchParams.append("tool", "lias-dashboard");
    searchUrl.searchParams.append("email", "lias@manus.im");
    if (NCBI_API_KEY) {
      searchUrl.searchParams.append("api_key", NCBI_API_KEY);
    }

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`PubMed search failed: ${searchResponse.statusText}`);
    }

    const searchText = await searchResponse.text();
    const pmids = extractPMIDs(searchText);

    if (pmids.length === 0) {
      console.log(`[PubMed] No results for query: "${query}"`);
      return [];
    }

    console.log(`[PubMed] Found ${pmids.length} PMIDs for "${query}"`);

    // Step 2: Fetch article details using efetch
    const fetchUrl = new URL(`${NCBI_BASE_URL}/efetch.fcgi`);
    fetchUrl.searchParams.append("db", "pubmed");
    fetchUrl.searchParams.append("id", pmids.join(","));
    fetchUrl.searchParams.append("rettype", "xml");
    fetchUrl.searchParams.append("tool", "lias-dashboard");
    fetchUrl.searchParams.append("email", "lias@manus.im");
    if (NCBI_API_KEY) {
      fetchUrl.searchParams.append("api_key", NCBI_API_KEY);
    }

    const fetchResponse = await fetch(fetchUrl.toString());
    if (!fetchResponse.ok) {
      throw new Error(`PubMed fetch failed: ${fetchResponse.statusText}`);
    }

    const fetchText = await fetchResponse.text();
    const articles = parsePubMedXML(fetchText);

    // Cache the results
    await cacheArticles(query, articles);

    return articles;
  } catch (error) {
    console.error("[PubMed] Search error:", error);
    return [];
  }
}

/**
 * Extract PMIDs from XML response
 */
function extractPMIDs(xml: string): string[] {
  const pmids: string[] = [];
  const idMatches = xml.match(/<Id>(\d+)<\/Id>/g) || [];

  for (const match of idMatches) {
    const pmid = match.replace(/<\/?Id>/g, "");
    if (pmid && /^\d+$/.test(pmid)) {
      pmids.push(pmid);
    }
  }

  return pmids;
}

/**
 * Parse PubMed XML response and extract article information
 */
function parsePubMedXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  try {
    // Extract articles from XML
    const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

    for (const articleXml of articleMatches) {
      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch?.[1];

      if (!pmid || !/^\d+$/.test(pmid)) {
        continue;
      }

      // Extract title
      const titleMatch = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
      const title = titleMatch?.[1] || "Untitled";

      // Extract journal
      const journalMatch = articleXml.match(/<Title>([^<]+)<\/Title>/);
      const source = journalMatch?.[1] || "Unknown Source";

      // Extract publication date
      const yearMatch = articleXml.match(/<Year>(\d{4})<\/Year>/);
      const monthMatch = articleXml.match(/<Month>(\d{1,2})<\/Month>/);
      const dayMatch = articleXml.match(/<Day>(\d{1,2})<\/Day>/);

      const year = yearMatch?.[1] || new Date().getFullYear().toString();
      const month = monthMatch?.[1]?.padStart(2, "0") || "01";
      const day = dayMatch?.[1]?.padStart(2, "0") || "01";
      const pubdate = `${year}-${month}-${day}`;

      // Extract authors
      const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      const authors = authorMatches
        .slice(0, 3)
        .map((authorXml) => {
          const lastNameMatch = authorXml.match(/<LastName>([^<]+)<\/LastName>/);
          const initials = authorXml.match(/<Initials>([^<]+)<\/Initials>/);
          const lastName = lastNameMatch?.[1] || "";
          const init = initials?.[1] || "";
          return lastName && init ? `${lastName} ${init}.` : lastName || "Unknown";
        })
        .filter((name) => name !== "Unknown");

      // Extract abstract
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/);
      const abstract = abstractMatch?.[1] || "No abstract available";

      articles.push({
        pmid,
        title,
        authors,
        source,
        pubdate,
        abstract: abstract.substring(0, 300) + (abstract.length > 300 ? "..." : ""),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }
  } catch (error) {
    console.error("[PubMed] Parse error:", error);
  }

  return articles;
}

/**
 * Get cached articles from database
 */
async function getCachedArticles(query: string): Promise<PubMedArticle[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const cached = await db
      .select()
      .from(cacheArtigos)
      .where(eq(cacheArtigos.termoBusca, query))
      .limit(1);

    if (cached.length === 0) return [];

    const cacheEntry = cached[0];
    const cacheAge = Date.now() - cacheEntry.dataBusca.getTime();
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (cacheAge > CACHE_TTL) {
      // Cache expired, delete it
      await db.delete(cacheArtigos).where(eq(cacheArtigos.id, cacheEntry.id));
      return [];
    }

    // Parse cached articles
    try {
      const articles = JSON.parse(cacheEntry.resultados);
      return articles;
    } catch {
      return [];
    }
  } catch (error) {
    console.error("[Cache] Error retrieving articles:", error);
    return [];
  }
}

/**
 * Cache articles in database
 */
async function cacheArticles(query: string, articles: PubMedArticle[]): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Check if cache entry exists
    const existing = await db
      .select()
      .from(cacheArtigos)
      .where(eq(cacheArtigos.termoBusca, query))
      .limit(1);

    const articlesJson = JSON.stringify(articles);

    if (existing.length > 0) {
      // Update existing cache
      await db
        .update(cacheArtigos)
        .set({
          resultados: articlesJson,
          updatedAt: new Date(),
        })
        .where(eq(cacheArtigos.id, existing[0].id));
    } else {
      // Create new cache entry
      await db.insert(cacheArtigos).values({
        termoBusca: query,
        resultados: articlesJson,
        dataBusca: new Date(),
      });
    }

    console.log(`[Cache] Cached ${articles.length} articles for "${query}"`);
  } catch (error) {
    console.error("[Cache] Error caching articles:", error);
  }
}

/**
 * Validate PMID and return correct PubMed URL
 */
export function getPubMedUrl(pmid: string): string {
  // Ensure PMID is numeric and valid
  if (!pmid || typeof pmid !== "string" || !/^\d+$/.test(pmid)) {
    return "https://pubmed.ncbi.nlm.nih.gov/";
  }
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}
