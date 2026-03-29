import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsReports() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily" as const,
    hour: 9,
    minute: 0,
    format: "pdf" as const,
    destination: "email" as const,
    recipientEmail: "",
    timeRange: "7d" as const,
    includeBenchmarks: true,
  });

  // Queries
  const { data: reports = [], isLoading, refetch } = trpc.analyticsReports.list.useQuery();
  
  // Mutations
  const createMutation = trpc.analyticsReports.create.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({
        name: "",
        description: "",
        frequency: "daily",
        hour: 9,
        minute: 0,
        format: "pdf",
        destination: "email",
        recipientEmail: "",
        timeRange: "7d",
        includeBenchmarks: true,
      });
      setShowForm(false);
    },
  });

  const updateMutation = trpc.analyticsReports.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setShowForm(false);
    },
  });

  const deleteMutation = trpc.analyticsReports.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const testRunMutation = trpc.analyticsReports.testRun.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (report: any) => {
    setFormData({
      name: report.name,
      description: report.description || "",
      frequency: report.frequency,
      hour: report.hour,
      minute: report.minute,
      format: report.format,
      destination: report.destination,
      recipientEmail: report.recipientEmail || "",
      timeRange: report.timeRange,
      includeBenchmarks: report.includeBenchmarks === 1,
    });
    setEditingId(report.id);
    setShowForm(true);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#000a1a", color: "#e0f9ff", fontFamily: "'Inter', sans-serif" }}>
      <main style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate("/analytics")}
            style={{
              background: "rgba(0,243,255,0.1)",
              border: "1px solid rgba(0,243,255,0.3)",
              color: "#00f3ff",
              borderRadius: 6,
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            ◀ Voltar aos Analytics
          </button>

          <h1 style={{ color: "#00f3ff", fontSize: 28, fontWeight: 700, margin: "8px 0 4px" }}>
            📅 Relatórios Automáticos
          </h1>
          <p style={{ color: "rgba(0,243,255,0.7)", marginBottom: 24 }}>
            Configure relatórios automáticos da página Analytics
          </p>
          <hr style={{ borderColor: "rgba(0,243,255,0.15)", marginBottom: 28 }} />
        </div>

        <Tabs defaultValue="reports" style={{ width: "100%" }}>
          <TabsList style={{ background: "rgba(0,243,255,0.1)", border: "1px solid rgba(0,243,255,0.2)", marginBottom: 24 }}>
            <TabsTrigger value="reports">Relatórios ({reports.length})</TabsTrigger>
            <TabsTrigger value="novo">Novo Relatório</TabsTrigger>
          </TabsList>

          {/* Relatórios Tab */}
          <TabsContent value="reports">
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(0,243,255,0.6)" }}>
                Carregando relatórios...
              </div>
            ) : reports.length === 0 ? (
              <Card style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)" }}>
                <CardContent style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ color: "rgba(0,243,255,0.6)", marginBottom: 16 }}>
                    Nenhum relatório configurado ainda
                  </p>
                  <Button
                    onClick={() => {
                      setEditingId(null);
                      setShowForm(true);
                    }}
                    style={{
                      background: "rgba(0,243,255,0.2)",
                      color: "#00f3ff",
                      border: "1px solid rgba(0,243,255,0.4)",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    + Criar Primeiro Relatório
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {reports.map((report: any) => (
                  <Card key={report.id} style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)" }}>
                    <CardHeader>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <div>
                          <CardTitle style={{ color: "#00f3ff", fontSize: 18 }}>{report.name}</CardTitle>
                          {report.description && (
                            <CardDescription style={{ color: "rgba(0,243,255,0.6)", marginTop: 4 }}>
                              {report.description}
                            </CardDescription>
                          )}
                        </div>
                        <span
                          style={{
                            background: report.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                            color: report.isActive ? "#22c55e" : "#ef4444",
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {report.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 16 }}>
                        <div>
                          <p style={{ color: "rgba(0,243,255,0.6)", fontSize: 12, marginBottom: 4 }}>Frequência</p>
                          <p style={{ color: "#00f3ff", fontWeight: 600 }}>
                            {report.frequency === "daily" ? "Diário" : report.frequency === "weekly" ? "Semanal" : "Mensal"}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "rgba(0,243,255,0.6)", fontSize: 12, marginBottom: 4 }}>Horário</p>
                          <p style={{ color: "#00f3ff", fontWeight: 600 }}>{String(report.hour).padStart(2, "0")}:{String(report.minute).padStart(2, "0")}</p>
                        </div>
                        <div>
                          <p style={{ color: "rgba(0,243,255,0.6)", fontSize: 12, marginBottom: 4 }}>Formato</p>
                          <p style={{ color: "#00f3ff", fontWeight: 600 }}>{report.format.toUpperCase()}</p>
                        </div>
                        <div>
                          <p style={{ color: "rgba(0,243,255,0.6)", fontSize: 12, marginBottom: 4 }}>Destino</p>
                          <p style={{ color: "#00f3ff", fontWeight: 600 }}>
                            {report.destination === "email" ? "Email" : report.destination === "googleDrive" ? "Google Drive" : "OneDrive"}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          onClick={() => handleEdit(report)}
                          style={{
                            background: "rgba(59,130,246,0.2)",
                            color: "#3b82f6",
                            border: "1px solid rgba(59,130,246,0.4)",
                            padding: "6px 12px",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✏️ Editar
                        </Button>
                        <Button
                          onClick={() => testRunMutation.mutate({ id: report.id })}
                          style={{
                            background: "rgba(34,197,94,0.2)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.4)",
                            padding: "6px 12px",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ▶️ Testar
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate({ id: report.id })}
                          style={{
                            background: "rgba(239,68,68,0.2)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.4)",
                            padding: "6px 12px",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️ Deletar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Novo Relatório Tab */}
          <TabsContent value="novo">
            <Card style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)" }}>
              <CardHeader>
                <CardTitle style={{ color: "#00f3ff" }}>
                  {editingId ? "✏️ Editar Relatório" : "➕ Novo Relatório"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                  {/* Nome */}
                  <div>
                    <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                      Nome do Relatório *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Relatório Semanal de Performance"
                      style={{
                        background: "rgba(0,243,255,0.05)",
                        border: "1px solid rgba(0,243,255,0.2)",
                        color: "#e0f9ff",
                        padding: "8px 12px",
                        borderRadius: 6,
                      }}
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                      Descrição
                    </label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição opcional"
                      style={{
                        background: "rgba(0,243,255,0.05)",
                        border: "1px solid rgba(0,243,255,0.2)",
                        color: "#e0f9ff",
                        padding: "8px 12px",
                        borderRadius: 6,
                      }}
                    />
                  </div>

                  {/* Frequência */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Frequência *
                      </label>
                      <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                        <SelectTrigger style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)", color: "#e0f9ff" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#000a1a", border: "1px solid rgba(0,243,255,0.2)" }}>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Período de Dados */}
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Período de Dados *
                      </label>
                      <Select value={formData.timeRange} onValueChange={(value: any) => setFormData({ ...formData, timeRange: value })}>
                        <SelectTrigger style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)", color: "#e0f9ff" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#000a1a", border: "1px solid rgba(0,243,255,0.2)" }}>
                          <SelectItem value="7d">Últimos 7 dias</SelectItem>
                          <SelectItem value="30d">Últimos 30 dias</SelectItem>
                          <SelectItem value="90d">Últimos 90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Hora e Minuto */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Hora (0-23)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={formData.hour}
                        onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                        style={{
                          background: "rgba(0,243,255,0.05)",
                          border: "1px solid rgba(0,243,255,0.2)",
                          color: "#e0f9ff",
                          padding: "8px 12px",
                          borderRadius: 6,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Minuto (0-59)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={formData.minute}
                        onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                        style={{
                          background: "rgba(0,243,255,0.05)",
                          border: "1px solid rgba(0,243,255,0.2)",
                          color: "#e0f9ff",
                          padding: "8px 12px",
                          borderRadius: 6,
                        }}
                      />
                    </div>
                  </div>

                  {/* Formato e Destino */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Formato *
                      </label>
                      <Select value={formData.format} onValueChange={(value: any) => setFormData({ ...formData, format: value })}>
                        <SelectTrigger style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)", color: "#e0f9ff" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#000a1a", border: "1px solid rgba(0,243,255,0.2)" }}>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Destino *
                      </label>
                      <Select value={formData.destination} onValueChange={(value: any) => setFormData({ ...formData, destination: value })}>
                        <SelectTrigger style={{ background: "rgba(0,243,255,0.05)", border: "1px solid rgba(0,243,255,0.2)", color: "#e0f9ff" }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#000a1a", border: "1px solid rgba(0,243,255,0.2)" }}>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="googleDrive">Google Drive</SelectItem>
                          <SelectItem value="oneDrive">OneDrive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Email */}
                  {formData.destination === "email" && (
                    <div>
                      <label style={{ color: "rgba(0,243,255,0.8)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>
                        Email de Destino *
                      </label>
                      <Input
                        type="email"
                        value={formData.recipientEmail}
                        onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                        placeholder="seu@email.com"
                        style={{
                          background: "rgba(0,243,255,0.05)",
                          border: "1px solid rgba(0,243,255,0.2)",
                          color: "#e0f9ff",
                          padding: "8px 12px",
                          borderRadius: 6,
                        }}
                        required
                      />
                    </div>
                  )}

                  {/* Incluir Benchmarks */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={formData.includeBenchmarks}
                      onChange={(e) => setFormData({ ...formData, includeBenchmarks: e.target.checked })}
                      style={{ cursor: "pointer" }}
                    />
                    <label style={{ color: "rgba(0,243,255,0.8)", cursor: "pointer" }}>
                      Incluir benchmarks externos (artificialanalysis.ai)
                    </label>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                      style={{
                        background: "rgba(0,243,255,0.1)",
                        color: "#00f3ff",
                        border: "1px solid rgba(0,243,255,0.3)",
                        padding: "8px 16px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      style={{
                        background: "rgba(34,197,94,0.2)",
                        color: "#22c55e",
                        border: "1px solid rgba(34,197,94,0.4)",
                        padding: "8px 16px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      {editingId ? "Atualizar" : "Criar"} Relatório
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
