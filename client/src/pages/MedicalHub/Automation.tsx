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
import { AlertCircle, Plus, Pause, Play, Trash2, Download, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Automation() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("scheduled");

  const [scheduledAnalyses] = useState([
    {
      id: "job-1",
      name: "Daily Health Check",
      frequency: "daily",
      time: "09:00",
      status: "active",
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    },
    {
      id: "job-2",
      name: "Weekly Report",
      frequency: "weekly",
      time: "18:00",
      status: "active",
      lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    prompt: "",
    frequency: "daily",
    time: "09:00",
    notifyEmail: user?.email || "",
    exportFormat: "pdf",
    cloudStorage: "none",
  });

  const handleCreateSchedule = () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      toast.error("Nome e prompt são obrigatórios");
      return;
    }

    toast.success("Análise agendada com sucesso!");
    setFormData({
      name: "",
      prompt: "",
      frequency: "daily",
      time: "09:00",
      notifyEmail: user?.email || "",
      exportFormat: "pdf",
      cloudStorage: "none",
    });
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
        <h1 className="text-4xl font-bold mb-2 text-orange-400">⚙️ Automação</h1>
        <p className="text-muted-foreground">
          Agende análises e relatórios automáticos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="create">Novo Agendamento</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <div className="space-y-4">
            {scheduledAnalyses.map((job) => (
              <Card
                key={job.id}
                className="p-6 border-orange-400/20 hover:border-orange-400/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-400 mb-2">{job.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold">Frequência:</span> {job.frequency}
                      </p>
                      <p>
                        <span className="font-semibold">Horário:</span> {job.time}
                      </p>
                      <p>
                        <span className="font-semibold">Última execução:</span>{" "}
                        {job.lastRun.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-semibold">Próxima execução:</span>{" "}
                        {job.nextRun.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className={
                        job.status === "active"
                          ? "bg-orange-500 hover:bg-orange-600 text-black"
                          : "bg-gray-500 hover:bg-gray-600 text-white"
                      }
                    >
                      {job.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Retomar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    ✓ Notificações por email habilitadas
                  </p>
                  <p className="text-muted-foreground">✓ Exportação em PDF configurada</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create">
          <Card className="p-6 border-orange-400/20">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-orange-400 font-semibold">
                  Nome do Agendamento *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Análise Diária de Saúde"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 border-orange-400/30 focus:border-orange-400"
                />
              </div>

              <div>
                <Label htmlFor="prompt" className="text-orange-400 font-semibold">
                  Prompt para Análise *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="Digite o prompt que será enviado para análise..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="mt-2 border-orange-400/30 focus:border-orange-400 min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency" className="text-orange-400 font-semibold">
                    Frequência
                  </Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger className="mt-2 border-orange-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time" className="text-orange-400 font-semibold">
                    Horário
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-2 border-orange-400/30 focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exportFormat" className="text-orange-400 font-semibold">
                    Formato de Exportação
                  </Label>
                  <Select
                    value={formData.exportFormat}
                    onValueChange={(value) =>
                      setFormData({ ...formData, exportFormat: value })
                    }
                  >
                    <SelectTrigger className="mt-2 border-orange-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cloudStorage" className="text-orange-400 font-semibold">
                    Armazenamento em Nuvem
                  </Label>
                  <Select
                    value={formData.cloudStorage}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cloudStorage: value })
                    }
                  >
                    <SelectTrigger className="mt-2 border-orange-400/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="google_drive">Google Drive</SelectItem>
                      <SelectItem value="onedrive">OneDrive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-orange-400 font-semibold">
                  Email para Notificações
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.notifyEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, notifyEmail: e.target.value })
                  }
                  className="mt-2 border-orange-400/30 focus:border-orange-400"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateSchedule}
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Análise
                </Button>
                <Button variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="space-y-4">
            <Card className="p-6 border-orange-400/20">
              <h2 className="text-2xl font-bold mb-6 text-orange-400">📊 Gerar Relatório</h2>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-400 font-semibold mb-2 block">
                      Formato
                    </Label>
                    <Select defaultValue="pdf">
                      <SelectTrigger className="border-orange-400/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-orange-400 font-semibold mb-2 block">
                      Período
                    </Label>
                    <Select defaultValue="7d">
                      <SelectTrigger className="border-orange-400/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Últimos 7 dias</SelectItem>
                        <SelectItem value="30d">Últimos 30 dias</SelectItem>
                        <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>

              <div className="border-t border-orange-400/20 pt-6">
                <h3 className="font-semibold text-orange-400 mb-4">Relatórios Recentes</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-orange-400/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm">Relatório de 28/03/2026</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Baixar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-orange-400/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm">Relatório de 27/03/2026</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Baixar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
