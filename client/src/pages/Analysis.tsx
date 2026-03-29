import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Save, X, Download, Upload } from "lucide-react";

const AI_MODELS = ["manus", "claude", "deepseek", "perplexity", "grok", "chat_z_ai"];

interface AnalysisResponse {
  id: number;
  aiModel: string;
  response: string;
  tokens: number;
  cost: string;
  processingTime: number;
  notes: string;
  rating: number;
  submittedBy: string;
  createdAt: string;
}

interface Analysis {
  id: number;
  title: string;
  prompt: string;
  category: string;
  responses: AnalysisResponse[];
  status: "draft" | "in_progress" | "completed";
  createdAt: string;
}

export default function Analysis() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [newAnalysis, setNewAnalysis] = useState({
    title: "",
    prompt: "",
    category: "general",
  });
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);
  const [editingResponse, setEditingResponse] = useState<Partial<AnalysisResponse>>({});
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null);

  const handleCreateAnalysis = () => {
    if (!newAnalysis.title || !newAnalysis.prompt) {
      alert("Preencha título e prompt");
      return;
    }

    const analysis: Analysis = {
      id: Date.now(),
      title: newAnalysis.title,
      prompt: newAnalysis.prompt,
      category: newAnalysis.category,
      responses: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    };

    setAnalyses([...analyses, analysis]);
    setNewAnalysis({ title: "", prompt: "", category: "general" });
    setSelectedAnalysisId(analysis.id);
  };

  const handleAddResponse = (analysisId: number, model: string) => {
    setAnalyses(
      analyses.map((a) =>
        a.id === analysisId
          ? {
              ...a,
              responses: [
                ...a.responses,
                {
                  id: Date.now(),
                  aiModel: model,
                  response: "",
                  tokens: 0,
                  cost: "0.00",
                  processingTime: 0,
                  notes: "",
                  rating: 0,
                  submittedBy: "Você",
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : a
      )
    );
  };

  const handleUpdateResponse = (analysisId: number, responseId: number, updates: Partial<AnalysisResponse>) => {
    setAnalyses(
      analyses.map((a) =>
        a.id === analysisId
          ? {
              ...a,
              responses: a.responses.map((r) => (r.id === responseId ? { ...r, ...updates } : r)),
            }
          : a
      )
    );
  };

  const handleDeleteResponse = (analysisId: number, responseId: number) => {
    setAnalyses(
      analyses.map((a) =>
        a.id === analysisId
          ? {
              ...a,
              responses: a.responses.filter((r) => r.id !== responseId),
            }
          : a
      )
    );
  };

  const handleExportAnalysis = (analysis: Analysis) => {
    const data = JSON.stringify(analysis, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.title}-${Date.now()}.json`;
    a.click();
  };

  const handleImportAnalysis = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const newId = Date.now();
        const importedAnalysis: Analysis = {
          ...data,
          id: newId,
          createdAt: new Date().toISOString(),
        };
        setAnalyses([...analyses, importedAnalysis]);
        alert("Análise importada com sucesso!");
      } catch (error) {
        alert("Erro ao importar arquivo");
      }
    };
    reader.readAsText(file);
  };

  const selectedAnalysis = analyses.find((a) => a.id === selectedAnalysisId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Análise Colaborativa de IAs
          </h1>
          <p className="text-slate-400">Teste e compare as 6 IAs com dados de custo, tokens e tempo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criar Nova Análise */}
          <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Nova Análise</CardTitle>
              <CardDescription>Crie uma nova análise para testar as IAs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Título</Label>
                <Input
                  placeholder="Ex: Teste de Resumo"
                  value={newAnalysis.title}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Categoria</Label>
                <Select value={newAnalysis.category} onValueChange={(v) => setNewAnalysis({ ...newAnalysis, category: v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="tech">Tecnologia</SelectItem>
                    <SelectItem value="business">Negócios</SelectItem>
                    <SelectItem value="research">Pesquisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Prompt</Label>
                <Textarea
                  placeholder="Cole o prompt que será testado..."
                  value={newAnalysis.prompt}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, prompt: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                />
              </div>

              <Button onClick={handleCreateAnalysis} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar Análise
              </Button>

              {/* Import/Export */}
              <div className="pt-4 border-t border-slate-700 space-y-2">
                <Label className="text-slate-300 text-sm">Importar/Exportar</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Importar
                      <input type="file" accept=".json" onChange={handleImportAnalysis} className="hidden" />
                    </label>
                  </Button>
                  {selectedAnalysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => handleExportAnalysis(selectedAnalysis)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análises Listadas */}
          <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">Análises ({analyses.length})</CardTitle>
              <CardDescription>Clique para editar as respostas das IAs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {analyses.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nenhuma análise criada ainda</p>
                ) : (
                  analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => setSelectedAnalysisId(analysis.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedAnalysisId === analysis.id
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50"
                          : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{analysis.title}</h3>
                          <p className="text-xs text-slate-400 truncate">{analysis.prompt}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                              {analysis.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                analysis.status === "completed"
                                  ? "border-green-500/50 text-green-400"
                                  : analysis.status === "in_progress"
                                    ? "border-yellow-500/50 text-yellow-400"
                                    : "border-slate-500 text-slate-400"
                              }`}
                            >
                              {analysis.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-slate-500 text-slate-300">
                              {analysis.responses.length}/6 IAs
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Respostas das IAs */}
        {selectedAnalysis && (
          <Card className="mt-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-cyan-400">{selectedAnalysis.title}</CardTitle>
                  <CardDescription className="mt-2">{selectedAnalysis.prompt}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Adicionar Respostas */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-700">
                  {AI_MODELS.map((model) => {
                    const hasResponse = selectedAnalysis.responses.some((r) => r.aiModel === model);
                    return (
                      <Button
                        key={model}
                        onClick={() => handleAddResponse(selectedAnalysis.id, model)}
                        disabled={hasResponse}
                        variant={hasResponse ? "secondary" : "outline"}
                        size="sm"
                        className={hasResponse ? "opacity-50 cursor-not-allowed" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {model.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>

                {/* Tabela de Respostas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">IA</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Resposta</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Tokens</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Custo</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Tempo (ms)</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Notas</th>
                        <th className="text-left py-3 px-2 text-slate-300 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.responses.map((response) => (
                        <tr key={response.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="py-3 px-2">
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{response.aiModel.toUpperCase()}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            {editingResponseId === response.id ? (
                              <Textarea
                                value={editingResponse.response || ""}
                                onChange={(e) => setEditingResponse({ ...editingResponse, response: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white text-xs min-h-[40px]"
                              />
                            ) : (
                              <p className="text-slate-300 truncate max-w-xs">{response.response || "-"}</p>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {editingResponseId === response.id ? (
                              <Input
                                type="number"
                                value={editingResponse.tokens || 0}
                                onChange={(e) => setEditingResponse({ ...editingResponse, tokens: parseInt(e.target.value) })}
                                className="bg-slate-700 border-slate-600 text-white text-xs w-20"
                              />
                            ) : (
                              <span className="text-slate-300">{response.tokens || "-"}</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {editingResponseId === response.id ? (
                              <Input
                                value={editingResponse.cost || "0.00"}
                                onChange={(e) => setEditingResponse({ ...editingResponse, cost: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white text-xs w-20"
                              />
                            ) : (
                              <span className="text-slate-300">R$ {response.cost || "0.00"}</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {editingResponseId === response.id ? (
                              <Input
                                type="number"
                                value={editingResponse.processingTime || 0}
                                onChange={(e) => setEditingResponse({ ...editingResponse, processingTime: parseInt(e.target.value) })}
                                className="bg-slate-700 border-slate-600 text-white text-xs w-20"
                              />
                            ) : (
                              <span className="text-slate-300">{response.processingTime || "-"}</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {editingResponseId === response.id ? (
                              <Textarea
                                value={editingResponse.notes || ""}
                                onChange={(e) => setEditingResponse({ ...editingResponse, notes: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-white text-xs min-h-[40px]"
                              />
                            ) : (
                              <p className="text-slate-300 truncate max-w-xs text-xs">{response.notes || "-"}</p>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex gap-2">
                              {editingResponseId === response.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      handleUpdateResponse(selectedAnalysis.id, response.id, editingResponse);
                                      setEditingResponseId(null);
                                    }}
                                    className="text-green-400 hover:bg-green-500/20"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingResponseId(null)}
                                    className="text-red-400 hover:bg-red-500/20"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingResponseId(response.id);
                                      setEditingResponse(response);
                                    }}
                                    className="text-cyan-400 hover:bg-cyan-500/20"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteResponse(selectedAnalysis.id, response.id)}
                                    className="text-red-400 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedAnalysis.responses.length === 0 && (
                  <p className="text-slate-400 text-center py-8">Nenhuma resposta adicionada ainda. Clique nos botões acima para adicionar.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
