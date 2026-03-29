import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Filter, BarChart3, Settings, Plus, Trash2 } from "lucide-react";

export default function PersonalizedDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  // Queries
  const preferencesQuery = trpc.preferences.get.useQuery(undefined);
  const favoritesQuery = trpc.favorites.list.useQuery(undefined);
  const filtersQuery = trpc.filters.list.useQuery(undefined);
  const reportsQuery = trpc.reports.list.useQuery({ reportType: undefined });
  const llmAnalysesQuery = trpc.llm.getAnalyses.useQuery({ type: undefined });

  // Mutations
  const addFavoriteMutation = trpc.favorites.add.useMutation();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();
  const createFilterMutation = trpc.filters.create.useMutation();
  const deleteFilterMutation = trpc.filters.delete.useMutation();
  const updatePreferencesMutation = trpc.preferences.update.useMutation();

  const handleAddFavorite = (analysisId: number) => {
    addFavoriteMutation.mutate(
      { analysisId },
      {
        onSuccess: () => {
          favoritesQuery.refetch();
        },
      }
    );
  };

  const handleRemoveFavorite = (analysisId: number) => {
    removeFavoriteMutation.mutate(
      { analysisId },
      {
        onSuccess: () => {
          favoritesQuery.refetch();
        },
      }
    );
  };

  const handleCreateFilter = (name: string, config: string) => {
    createFilterMutation.mutate(
      {
        filterName: name,
        filterConfig: config,
      },
      {
        onSuccess: () => {
          filtersQuery.refetch();
        },
      }
    );
  };

  const handleDeleteFilter = (filterId: number) => {
    deleteFilterMutation.mutate(
      { filterId },
      {
        onSuccess: () => {
          filtersQuery.refetch();
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2">
            Dashboard Personalizado
          </h1>
          <p className="text-gray-400">
            Bem-vindo, {user?.name}! Gerencie suas preferências, análises favoritas e relatórios automáticos.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-purple-500/30">
            <TabsTrigger value="overview" className="text-cyan-400">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-purple-400">
              <Heart className="w-4 h-4 mr-2" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-pink-400">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-green-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stats Cards */}
              <Card className="bg-slate-900/50 border-cyan-500/30 hover:border-cyan-500/60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Análises Favoritas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-400">{favoritesQuery.data?.length || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-purple-500/30 hover:border-purple-500/60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Filtros Salvos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">{filtersQuery.data?.length || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-pink-500/30 hover:border-pink-500/60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Análises LLM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pink-400">{llmAnalysesQuery.data?.length || 0}</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-green-500/30 hover:border-green-500/60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">{reportsQuery.data?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Preferences Card */}
            <Card className="bg-slate-900/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Settings className="w-5 h-5" />
                  Preferências Gerais
                </CardTitle>
                <CardDescription>Customize sua experiência no LIAS Dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preferencesQuery.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Tema</label>
                      <Select
                        value={preferencesQuery.data.theme || "cyberpunk"}
                        onValueChange={(value) => {
                          updatePreferencesMutation.mutate({ theme: value });
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-purple-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                          <SelectItem value="dark">Escuro</SelectItem>
                          <SelectItem value="light">Claro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300">Frequência de Relatórios</label>
                      <Select
                        value={preferencesQuery.data.autoReportFrequency || "weekly"}
                        onValueChange={(value) => {
                          updatePreferencesMutation.mutate({
                            autoReportFrequency: value as "daily" | "weekly" | "monthly",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-purple-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-300">Modelos Favoritos</label>
                      <Input
                        placeholder="Ex: Manus, Claude 3.5, DeepSeek R1"
                        defaultValue={preferencesQuery.data.favoriteModels || ""}
                        className="bg-slate-800 border-purple-500/30"
                        onBlur={(e) => {
                          updatePreferencesMutation.mutate({
                            favoriteModels: e.currentTarget.value,
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <Card className="bg-slate-900/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Análises Favoritas</CardTitle>
                <CardDescription>Suas análises salvas para acesso rápido</CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-400">Carregando...</div>
                ) : favoritesQuery.data && favoritesQuery.data.length > 0 ? (
                  <div className="space-y-2">
                    {favoritesQuery.data.map((analysisId) => (
                      <div
                        key={analysisId}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-colors"
                      >
                        <span className="text-gray-300">Análise #{analysisId}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFavorite(analysisId)}
                          className="text-pink-400 hover:text-pink-300"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">Nenhuma análise favorita ainda</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <Card className="bg-slate-900/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Filtros Salvos</CardTitle>
                <CardDescription>Gerencie seus filtros personalizados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create New Filter */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
                  <div className="flex gap-2 mb-4">
                    <Input
                      id="filterName"
                      placeholder="Nome do filtro"
                      className="bg-slate-700 border-purple-500/30"
                    />
                    <Button
                      onClick={() => {
                        const nameInput = document.getElementById("filterName") as HTMLInputElement;
                        if (nameInput?.value) {
                          handleCreateFilter(nameInput.value, JSON.stringify({}));
                          nameInput.value = "";
                        }
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo
                    </Button>
                  </div>
                </div>

                {/* Saved Filters List */}
                {filtersQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-400">Carregando...</div>
                ) : filtersQuery.data && filtersQuery.data.length > 0 ? (
                  <div className="space-y-2">
                    {filtersQuery.data.map((filter) => (
                      <div
                        key={filter.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-300">{filter.filterName}</p>
                          <p className="text-xs text-gray-500">
                            Criado em: {new Date(filter.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">Nenhum filtro salvo ainda</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-slate-900/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400">Relatórios Automáticos</CardTitle>
                <CardDescription>Seus relatórios gerados automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                {reportsQuery.isLoading ? (
                  <div className="text-center py-8 text-gray-400">Carregando...</div>
                ) : reportsQuery.data && reportsQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {reportsQuery.data.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-green-500/20 hover:border-green-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-300">
                            Relatório {report.reportType === "weekly" ? "Semanal" : "Mensal"}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            {report.sentAt ? "Enviado" : "Pendente"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Gerado em: {new Date(report.generatedAt).toLocaleDateString("pt-BR")}
                        </p>
                        {report.sentAt && (
                          <p className="text-xs text-gray-500">
                            Enviado em: {new Date(report.sentAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">Nenhum relatório gerado ainda</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
