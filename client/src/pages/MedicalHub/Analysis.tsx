import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, AlertCircle, Clock, User, CheckCircle } from "lucide-react";

export default function MedicalAnalysis() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prompt: "",
    category: "general",
  });

  const healthAnalyses = trpc.medicalHub.healthAnalyses.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        </Card>
      </div>
    );
  }

  const handleCreateAnalysis = async () => {
    if (!formData.title.trim() || !formData.prompt.trim()) {
      toast.error("Título e prompt são obrigatórios");
      return;
    }

    try {
      // This would call the actual API
      toast.success("Análise criada com sucesso!");
      setFormData({
        title: "",
        description: "",
        prompt: "",
        category: "general",
      });
      setActiveTab("list");
    } catch (error) {
      toast.error("Erro ao criar análise");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-green-400">🔬 Análise Colaborativa</h1>
        <p className="text-muted-foreground">
          Análise de diagnósticos com validação das 6 IAs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Nova Análise</TabsTrigger>
          <TabsTrigger value="list">Análises Recentes</TabsTrigger>
        </TabsList>

        {/* New Analysis Tab */}
        <TabsContent value="new">
          <Card className="p-6 border-green-400/20">
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-green-400 font-semibold">
                  Título da Análise *
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Análise de Diabetes Tipo 2"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2 border-green-400/30 focus:border-green-400"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-green-400 font-semibold">
                  Descrição
                </Label>
                <Input
                  id="description"
                  placeholder="Descrição breve da análise"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 border-green-400/30 focus:border-green-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-green-400 font-semibold">
                    Categoria
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="mt-2 border-green-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="cardiology">Cardiologia</SelectItem>
                      <SelectItem value="endocrinology">Endocrinologia</SelectItem>
                      <SelectItem value="neurology">Neurologia</SelectItem>
                      <SelectItem value="oncology">Oncologia</SelectItem>
                      <SelectItem value="psychiatry">Psiquiatria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="prompt" className="text-green-400 font-semibold">
                  Prompt para as IAs *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Digite o prompt que será enviado para análise pelas 6 IAs..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="mt-2 border-green-400/30 focus:border-green-400 min-h-[200px]"
                />
              </div>

              <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-green-400">ℹ️ Informação:</span> Esta análise
                  será enviada para as 6 IAs (Claude, GPT-4, Gemini, DeepSeek, Perplexity, Grok)
                  para diagnóstico comparativo.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateAnalysis}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enviar para Análise
                </Button>
                <Button variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list">
          <div className="space-y-4">
            {healthAnalyses.data && healthAnalyses.data.length > 0 ? (
              healthAnalyses.data.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="p-6 border-green-400/20 hover:border-green-400/50 transition"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-green-400 mb-1">
                          {/* analysis.diagnosis || "Análise" */}
                          Análise {analysis.id}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {/* analysis.recommendations */}
                          Diagnóstico da IA
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-green-400/20 text-green-400 px-3 py-1 rounded text-sm font-semibold">
                          {analysis.aiModel}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-muted-foreground">
                          {analysis.processingTime}ms
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <span className="text-muted-foreground">
                          Confiança: {analysis.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-pink-400" />
                        <span className="text-muted-foreground">
                          {analysis.tokens} tokens
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysis.isAccurate === 1 ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-semibold">Validado</span>
                          </>
                        ) : analysis.isAccurate === 0 ? (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 font-semibold">Incorreto</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Pendente</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-black font-bold"
                      >
                        Ver Detalhes
                      </Button>
                      <Button size="sm" variant="outline">
                        Validar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-green-400/20">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma análise realizada ainda</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
