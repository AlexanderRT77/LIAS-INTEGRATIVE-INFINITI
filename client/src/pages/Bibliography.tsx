import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Search,
    ExternalLink,
    BookOpen,
    Lightbulb,
    ChevronLeft,
    ChevronRight,
    Heart,
    Clock,
    Filter,
    Download,
    FileText,
  } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Article {
  id: string;
  title: string;
  source: string;
  pubdate: string;
  authors?: string[];
  abstract?: string;
  url: string;
}

export default function Bibliography() {
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [minYear, setMinYear] = useState<number | undefined>();
  const [maxYear, setMaxYear] = useState<number | undefined>();
  const [journal, setJournal] = useState("");

  // Fetch search suggestions on component mount
  const suggestionsQuery = trpc.bibliography.getSuggestions.useQuery();

  useEffect(() => {
    if (suggestionsQuery.data?.suggestions) {
      setSuggestions(suggestionsQuery.data.suggestions);
    }
  }, [suggestionsQuery.data]);

  // Use mutation for search
  const searchMutation = trpc.bibliography.search.useMutation({
    onSuccess: (result) => {
      if (result.success && result.articles.length > 0) {
        setArticles(result.articles);
        setTotalPages(result.totalPages);
        setCurrentPage(result.page);
        toast.success(
          `${result.totalResults} artigos encontrados (página ${result.page} de ${result.totalPages})`
        );
      } else if (result.success && result.articles.length === 0) {
        setArticles([]);
        setTotalPages(0);
        toast.info(`Nenhum artigo encontrado para "${searchTerm}"`);
      } else {
        setArticles([]);
        setTotalPages(0);
        toast.error(result.error || "Erro ao buscar artigos");
      }
    },
    onError: (error) => {
      console.error("Search error:", error);
      setArticles([]);
      setTotalPages(0);
      toast.error("Erro ao buscar artigos no PubMed");
    },
  });

  const handleSearch = async (e: React.FormEvent, query?: string, page = 1) => {
    e.preventDefault();

    const searchQuery = query || searchTerm.trim();

    if (!searchQuery) {
      toast.error("Por favor, digite um termo de busca");
      return;
    }

    setSearchTerm(searchQuery);
    setHasSearched(true);
    setCurrentPage(page);

    // Call mutation with search parameters
    searchMutation.mutate({
      query: searchQuery,
      page,
      pageSize,
      minYear,
      maxYear,
      journal: journal || undefined,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    const form = new Event("submit") as any;
    form.preventDefault = () => {};
    handleSearch(form as React.FormEvent, suggestion, 1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    const form = new Event("submit") as any;
    form.preventDefault = () => {};
    handleSearch(form as React.FormEvent, searchTerm, 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const form = new Event("submit") as any;
      form.preventDefault = () => {};
      handleSearch(form as React.FormEvent, searchTerm, currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const form = new Event("submit") as any;
      form.preventDefault = () => {};
      handleSearch(form as React.FormEvent, searchTerm, currentPage - 1);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    const form = new Event("submit") as any;
    form.preventDefault = () => {};
    handleSearch(form as React.FormEvent, searchTerm, 1);
  };

  // Export mutations
  const exportCSVMutation = trpc.bibliography.exportToCSV.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "articles.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Artigos exportados para CSV com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar para CSV");
      }
    },
    onError: (error) => {
      console.error("Export CSV error:", error);
      toast.error("Erro ao exportar para CSV");
    },
  });

  const exportPDFMutation = trpc.bibliography.exportToPDF.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        const binaryString = window.atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "articles.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Artigos exportados para PDF com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar para PDF");
      }
    },
    onError: (error) => {
      console.error("Export PDF error:", error);
      toast.error("Erro ao exportar para PDF");
    },
  });

  const handleExportCSV = () => {
    if (articles.length === 0) {
      toast.error("Nenhum artigo para exportar");
      return;
    }
    exportCSVMutation.mutate({
      query: searchTerm,
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        authors: a.authors,
        source: a.source,
        pubdate: a.pubdate,
        abstract: a.abstract,
        url: a.url,
      })),
    });
  };

  const handleExportPDF = () => {
    if (articles.length === 0) {
      toast.error("Nenhum artigo para exportar");
      return;
    }
    exportPDFMutation.mutate({
      query: searchTerm,
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        authors: a.authors,
        source: a.source,
        pubdate: a.pubdate,
        abstract: a.abstract,
        url: a.url,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg border border-cyan-500/30">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
              Buscador Bibliográfico
            </h1>
          </div>
          <p className="text-slate-400">
            Pesquise artigos científicos do PubMed com filtros avançados e paginação
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 bg-slate-900/50 border-cyan-500/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-cyan-400">Buscar Artigos</CardTitle>
            <CardDescription>
              Digite palavras-chave médicas para encontrar artigos relevantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Ex: Diabetes, Cancer, Artificial Intelligence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-white placeholder:text-slate-500"
                disabled={searchMutation.isPending}
              />
              <Button
                type="submit"
                disabled={searchMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white gap-2"
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </form>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Ano Mínimo</label>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={minYear || ""}
                    onChange={(e) => setMinYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                    placeholder="Ex: 2020"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Ano Máximo</label>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={maxYear || ""}
                    onChange={(e) => setMaxYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                    placeholder="Ex: 2026"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Journal</label>
                  <Input
                    type="text"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    className="bg-slate-800/50 border-cyan-500/30 text-white"
                    placeholder="Ex: Nature, JAMA..."
                  />
                </div>
              </div>
            )}

            {/* Search Suggestions */}
            {!hasSearched && suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Sugestões populares:
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }}
                      className="px-3 py-1 text-sm bg-slate-800/50 hover:bg-slate-700/50 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 rounded-full transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {/* Page Size and Pagination Info */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
              <div className="text-sm text-slate-400">
                {articles.length > 0
                  ? `Mostrando ${articles.length} artigos (página ${currentPage} de ${totalPages})`
                  : "Nenhum artigo encontrado"}
              </div>
              <div className="flex gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="px-3 py-1 text-sm bg-slate-800/50 border border-cyan-500/30 text-cyan-400 rounded"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>

            {/* Articles */}
            {articles.map((article) => (
              <div
                key={article.id}
                className="p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition-all backdrop-blur group"
              >
                {/* Title */}
                <div className="flex justify-between items-start gap-4 mb-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 flex-1"
                  >
                    {article.title}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-5 h-5 text-pink-500 hover:fill-pink-500" />
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-3 text-sm text-slate-400">
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    PMID: {article.id}
                  </Badge>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    {article.source}
                  </Badge>
                  <Badge variant="outline" className="border-slate-500/30">
                    {article.pubdate}
                  </Badge>
                </div>

                {/* Authors */}
                {article.authors && article.authors.length > 0 && (
                  <div className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold text-slate-400">Autores:</span>{" "}
                    {article.authors.join(", ")}
                  </div>
                )}

                {/* Abstract */}
                {article.abstract && (
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {article.abstract}
                  </p>
                )}
              </div>
            ))}

            {/* Export Buttons */}
            {articles.length > 0 && (
              <div className="flex gap-3 p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <Button
                  onClick={handleExportCSV}
                  disabled={exportCSVMutation.isPending}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10 gap-2 flex-1"
                >
                  {exportCSVMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Exportar CSV
                </Button>
                <Button
                  onClick={handleExportPDF}
                  disabled={exportPDFMutation.isPending}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2 flex-1"
                >
                  {exportPDFMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Exportar PDF
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg border border-cyan-500/10">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || searchMutation.isPending}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <div className="text-sm text-slate-400">
                  Página {currentPage} de {totalPages}
                </div>

                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || searchMutation.isPending}
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {hasSearched && articles.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-700/50 text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhum artigo encontrado para "{searchTerm}"</p>
            <p className="text-slate-500 text-sm mt-2">
              Tente usar outros termos de busca ou ajustar os filtros
            </p>
          </Card>
        )}

        {!hasSearched && (
          <Card className="bg-slate-900/50 border-slate-700/50 text-center py-12">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Comece digitando um termo de busca</p>
            <p className="text-slate-500 text-sm mt-2">
              Pesquise artigos científicos do PubMed em tempo real
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
