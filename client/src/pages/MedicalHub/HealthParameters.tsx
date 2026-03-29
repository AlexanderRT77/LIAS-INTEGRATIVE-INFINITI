import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

export default function HealthParameters() {
  const { user, isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    parameterName: "",
    parameterType: "numeric" as const,
    unit: "",
    normalRange: "",
    description: "",
  });

  const healthParams = trpc.medicalHub.healthParameters.list.useQuery();
  const createParam = trpc.medicalHub.healthParameters.create.useMutation();
  const deleteParam = trpc.medicalHub.healthParameters.delete.useMutation();

  const handleCreate = async () => {
    if (!formData.parameterName.trim()) {
      toast.error("Nome do parâmetro é obrigatório");
      return;
    }

    try {
      await createParam.mutateAsync(formData);
      toast.success("Parâmetro criado com sucesso!");
      setFormData({
        parameterName: "",
        parameterType: "numeric",
        unit: "",
        normalRange: "",
        description: "",
      });
      setIsCreating(false);
      healthParams.refetch();
    } catch (error) {
      toast.error("Erro ao criar parâmetro");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este parâmetro?")) return;

    try {
      await deleteParam.mutateAsync({ id });
      toast.success("Parâmetro deletado com sucesso!");
      healthParams.refetch();
    } catch (error) {
      toast.error("Erro ao deletar parâmetro");
    }
  };

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

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-cyan-400">📋 Parâmetros de Saúde</h1>
        <p className="text-muted-foreground">
          Gerenciar parâmetros de saúde que serão analisados pelas IAs
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Parâmetros</TabsTrigger>
          <TabsTrigger value="create">Novo Parâmetro</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list">
          <Card className="p-6 border-cyan-400/20">
            {healthParams.data && healthParams.data.length > 0 ? (
              <div className="space-y-4">
                {healthParams.data.map((param) => (
                  <div
                    key={param.id}
                    className="p-4 border border-cyan-400/20 rounded-lg hover:border-cyan-400/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-cyan-400 mb-1">
                          {param.parameterName}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <p>
                            <span className="font-semibold">Tipo:</span> {param.parameterType}
                          </p>
                          <p>
                            <span className="font-semibold">Unidade:</span> {param.unit || "N/A"}
                          </p>
                          {param.description && (
                            <p className="col-span-2">
                              <span className="font-semibold">Descrição:</span> {param.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(param.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum parâmetro criado ainda
              </p>
            )}
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create">
          <Card className="p-6 border-cyan-400/20">
            <div className="space-y-6">
              <div>
                <Label htmlFor="parameterName" className="text-cyan-400 font-semibold">
                  Nome do Parâmetro *
                </Label>
                <Input
                  id="parameterName"
                  placeholder="Ex: Glicose, Pressão Arterial, Colesterol"
                  value={formData.parameterName}
                  onChange={(e) =>
                    setFormData({ ...formData, parameterName: e.target.value })
                  }
                  className="mt-2 border-cyan-400/30 focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parameterType" className="text-cyan-400 font-semibold">
                    Tipo de Parâmetro *
                  </Label>
                  <Select
                    value={formData.parameterType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, parameterType: value })
                    }
                  >
                    <SelectTrigger className="mt-2 border-cyan-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numérico</SelectItem>
                      <SelectItem value="categorical">Categórico</SelectItem>
                      <SelectItem value="boolean">Booleano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit" className="text-cyan-400 font-semibold">
                    Unidade
                  </Label>
                  <Input
                    id="unit"
                    placeholder="Ex: mg/dL, mmHg, %"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-2 border-cyan-400/30 focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="normalRange" className="text-cyan-400 font-semibold">
                  Intervalo Normal
                </Label>
                <Input
                  id="normalRange"
                  placeholder="Ex: 70-100 (para glicose)"
                  value={formData.normalRange}
                  onChange={(e) =>
                    setFormData({ ...formData, normalRange: e.target.value })
                  }
                  className="mt-2 border-cyan-400/30 focus:border-cyan-400"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-cyan-400 font-semibold">
                  Descrição
                </Label>
                <Input
                  id="description"
                  placeholder="Descrição do parâmetro"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-2 border-cyan-400/30 focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={createParam.isPending}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createParam.isPending ? "Criando..." : "Criar Parâmetro"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
