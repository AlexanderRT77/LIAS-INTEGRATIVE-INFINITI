import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Calendar, Cloud, Download, Edit2, Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ScheduledReports() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    searchQuery: "",
    frequency: "daily" as const,
    dayOfWeek: 0,
    dayOfMonth: 1,
    hour: 9,
    exportFormat: "both" as const,
    destination: "email" as const,
    email: "",
  });

  // Queries
  const { data: scheduledExports, isLoading: loadingExports, refetch: refetchExports } = trpc.scheduled.list.useQuery();
  const { data: cloudStatus } = trpc.scheduled.getCloudStorageStatus.useQuery();
  const { data: exportHistory } = trpc.scheduled.getHistory.useQuery({ limit: 10 });

  // Mutations
  const createMutation = trpc.scheduled.createScheduled.useMutation({
    onSuccess: () => {
      refetchExports();
      setShowForm(false);
      setFormData({
        name: "",
        searchQuery: "",
        frequency: "daily",
        dayOfWeek: 0,
        dayOfMonth: 1,
        hour: 9,
        exportFormat: "both",
        destination: "email",
        email: "",
      });
    },
  });

  const updateMutation = trpc.scheduled.update.useMutation({
    onSuccess: () => {
      refetchExports();
      setEditingId(null);
      setShowForm(false);
    },
  });

  const deleteMutation = trpc.scheduled.delete.useMutation({
    onSuccess: () => {
      refetchExports();
    },
  });

  const googleAuthMutation = trpc.scheduled.getGoogleDriveAuthUrl.useMutation();
  const oneDriveAuthMutation = trpc.scheduled.getOneDriveAuthUrl.useMutation();
  const disconnectMutation = trpc.scheduled.disconnectCloudStorage.useMutation({
    onSuccess: () => {
      // Refetch cloud status
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.searchQuery) {
      alert("Por favor, preencha o nome e a busca");
      return;
    }

    if (formData.destination !== "email" && !formData.email && formData.destination === "email") {
      alert("Por favor, preencha o email");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
    }
  };

  const handleEdit = (report: any) => {
    setFormData({
      name: report.name,
      searchQuery: report.searchQuery,
      frequency: report.frequency,
      dayOfWeek: report.dayOfWeek || 0,
      dayOfMonth: report.dayOfMonth || 1,
      hour: report.hour || 9,
      exportFormat: report.exportFormat,
      destination: report.destination,
      email: report.email || "",
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este relatório?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleGoogleDriveAuth = async () => {
    try {
      const url = await googleAuthMutation.mutateAsync();
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao conectar Google Drive:", error);
    }
  };

  const handleOneDriveAuth = async () => {
    try {
      const url = await oneDriveAuthMutation.mutateAsync();
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao conectar OneDrive:", error);
    }
  };

  const handleDisconnect = async (provider: "googleDrive" | "oneDrive") => {
    if (confirm(`Tem certeza que deseja desconectar ${provider === "googleDrive" ? "Google Drive" : "OneDrive"}?`)) {
      await disconnectMutation.mutateAsync({ provider });
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: "Diariamente",
      weekly: "Semanalmente",
      monthly: "Mensalmente",
    };
    return labels[frequency] || frequency;
  };

  const getDestinationLabel = (destination: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      googleDrive: "Google Drive",
      oneDrive: "OneDrive",
      both: "Email + Nuvem",
    };
    return labels[destination] || destination;
  };

  const getFormatLabel = (format: string) => {
    const labels: Record<string, string> = {
      csv: "CSV",
      pdf: "PDF",
      both: "CSV + PDF",
    };
    return labels[format] || format;
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "processing") return <Clock className="w-4 h-4 text-blue-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-cyan-400">📅 Relatórios Agendados</h1>
        <p className="text-gray-400 mt-2">Configure e gerencie seus relatórios automáticos</p>
      </div>

      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="cloud">Nuvem</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Aba: Relatórios Agendados */}
        <TabsContent value="scheduled" className="space-y-4">
          {!showForm && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({
                  name: "",
                  searchQuery: "",
                  frequency: "daily",
                  dayOfWeek: 0,
                  dayOfMonth: 1,
                  hour: 9,
                  exportFormat: "both",
                  destination: "email",
                  email: "",
                });
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Relatório
            </Button>
          )}

          {showForm && (
            <Card className="border-cyan-600 bg-slate-900">
              <CardHeader>
                <CardTitle>{editingId ? "Editar Relatório" : "Novo Relatório"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="name" className="text-gray-300">
                      Nome do Relatório
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Relatório Semanal de Diabetes"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  {/* Busca */}
                  <div>
                    <Label htmlFor="search" className="text-gray-300">
                      Termo de Busca
                    </Label>
                    <Input
                      id="search"
                      value={formData.searchQuery}
                      onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
                      placeholder="Ex: Diabetes, Cancer, AI in Medicine"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  {/* Frequência */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency" className="text-gray-300">
                        Frequência
                      </Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) =>
                          setFormData({ ...formData, frequency: value as any })
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="hour" className="text-gray-300">
                        Hora
                      </Label>
                      <Select
                        value={formData.hour.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, hour: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Formato de Exportação */}
                  <div>
                    <Label htmlFor="format" className="text-gray-300">
                      Formato
                    </Label>
                    <Select
                      value={formData.exportFormat}
                      onValueChange={(value) =>
                        setFormData({ ...formData, exportFormat: value as any })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="both">CSV + PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destino */}
                  <div>
                    <Label htmlFor="destination" className="text-gray-300">
                      Destino
                    </Label>
                    <Select
                      value={formData.destination}
                      onValueChange={(value) =>
                        setFormData({ ...formData, destination: value as any })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="googleDrive">Google Drive</SelectItem>
                        <SelectItem value="oneDrive">OneDrive</SelectItem>
                        <SelectItem value="both">Email + Nuvem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  {(formData.destination === "email" || formData.destination === "both") && (
                    <div>
                      <Label htmlFor="email" className="text-gray-300">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu.email@example.com"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      {editingId ? "Atualizar" : "Criar"} Relatório
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForm(false)}
                      variant="outline"
                      className="border-slate-700 text-gray-300 hover:bg-slate-800"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de Relatórios */}
          {loadingExports ? (
            <div className="text-center text-gray-400">Carregando...</div>
          ) : scheduledExports && scheduledExports.length > 0 ? (
            <div className="grid gap-4">
              {scheduledExports.map((report) => (
                <Card key={report.id} className="border-slate-700 bg-slate-900">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-cyan-400">{report.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">Busca: {report.searchQuery}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge variant="outline" className="bg-slate-800 border-slate-600 text-cyan-400">
                            {getFrequencyLabel(report.frequency)}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 border-slate-600 text-pink-400">
                            {getFormatLabel(report.exportFormat)}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 border-slate-600 text-green-400">
                            {getDestinationLabel(report.destination)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${
                              report.isActive
                                ? "bg-green-900 border-green-700 text-green-300"
                                : "bg-red-900 border-red-700 text-red-300"
                            }`}
                          >
                            {report.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(report)}
                          variant="outline"
                          className="border-slate-600 text-gray-300 hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-slate-700 bg-slate-900">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-gray-400">
                Nenhum relatório agendado. Crie um novo para começar!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Aba: Gerenciamento de Nuvem */}
        <TabsContent value="cloud" className="space-y-4">
          <div className="grid gap-4">
            {/* Google Drive */}
            <Card className="border-slate-700 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  Google Drive
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cloudStatus?.googleDrive ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Conectado com sucesso</span>
                    </div>
                    <Button
                      onClick={() => handleDisconnect("googleDrive")}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-400">
                      Conecte sua conta Google Drive para salvar relatórios automaticamente na nuvem.
                    </p>
                    <Button
                      onClick={handleGoogleDriveAuth}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Cloud className="w-4 h-4 mr-2" />
                      Conectar Google Drive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OneDrive */}
            <Card className="border-slate-700 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-green-400" />
                  OneDrive
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cloudStatus?.oneDrive ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>Conectado com sucesso</span>
                    </div>
                    <Button
                      onClick={() => handleDisconnect("oneDrive")}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-400">
                      Conecte sua conta OneDrive para salvar relatórios automaticamente na nuvem.
                    </p>
                    <Button
                      onClick={handleOneDriveAuth}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Cloud className="w-4 h-4 mr-2" />
                      Conectar OneDrive
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {exportHistory && exportHistory.length > 0 ? (
            <div className="grid gap-3">
              {exportHistory.map((item) => (
                <Card key={item.id} className="border-slate-700 bg-slate-900">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-semibold text-cyan-400">{item.searchQuery}</p>
                            <p className="text-sm text-gray-400">
                              {item.format} • {item.destination}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {item.exportedAt
                            ? new Date(item.exportedAt).toLocaleDateString("pt-BR")
                            : "Pendente"}
                        </p>
                        {item.status === "completed" && (
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-slate-800">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-slate-700 bg-slate-900">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-gray-400">
                Nenhuma exportação realizada ainda.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
