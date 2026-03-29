import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Play, Pause, RotateCcw, Download, Filter } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  model: string;
  status: "success" | "error" | "pending";
  processingTime: number;
  tokens: number;
  cost: string;
  diagnosis: string;
  confidence: number;
}

export default function RealtimeLogs() {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const validationStats = trpc.medicalHub.validationHistory.getStats.useQuery();

  useEffect(() => {
    if (!isLive) return;

    // Simulate real-time log updates
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        model: ["Claude", "GPT-4", "Gemini", "DeepSeek", "Perplexity", "Grok"][
          Math.floor(Math.random() * 6)
        ],
        status: ["success", "error", "pending"][Math.floor(Math.random() * 3)] as any,
        processingTime: Math.floor(Math.random() * 500) + 100,
        tokens: Math.floor(Math.random() * 1000) + 100,
        cost: (Math.random() * 0.01).toFixed(6),
        diagnosis: "Sample diagnosis",
        confidence: Math.floor(Math.random() * 100),
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

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

  const filteredLogs = logs.filter((log) => {
    if (filter !== "all" && log.status !== filter) return false;
    if (searchTerm && !log.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    return true;
  });

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    error: logs.filter((l) => l.status === "error").length,
    pending: logs.filter((l) => l.status === "pending").length,
  };

  const avgProcessingTime =
    logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.processingTime, 0) / logs.length)
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-green-400">⚡ Logs em Tempo Real</h1>
        <p className="text-muted-foreground">
          Monitoramento ao vivo de análises e operações do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4 border-green-400/30 bg-green-400/5">
          <p className="text-sm text-muted-foreground mb-1">Total de Logs</p>
          <p className="text-2xl font-bold text-green-400">{stats.total}</p>
        </Card>

        <Card className="p-4 border-cyan-400/30 bg-cyan-400/5">
          <p className="text-sm text-muted-foreground mb-1">Sucesso</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.success}</p>
        </Card>

        <Card className="p-4 border-red-400/30 bg-red-400/5">
          <p className="text-sm text-muted-foreground mb-1">Erros</p>
          <p className="text-2xl font-bold text-red-400">{stats.error}</p>
        </Card>

        <Card className="p-4 border-yellow-400/30 bg-yellow-400/5">
          <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </Card>

        <Card className="p-4 border-blue-400/30 bg-blue-400/5">
          <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
          <p className="text-2xl font-bold text-blue-400">{avgProcessingTime}ms</p>
        </Card>
      </div>

      {/* Controls */}
      <Card className="p-6 border-green-400/20 mb-8">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-green-400 font-semibold mb-2 block">Buscar Diagnóstico</Label>
            <Input
              placeholder="Digite para filtrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-green-400/30 focus:border-green-400"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsLive(!isLive)}
              className={isLive ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
            >
              {isLive ? (
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
              variant="outline"
              onClick={() => setLogs([])}
              className="text-green-400 hover:text-green-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>

            <Button variant="outline" className="text-green-400 hover:text-green-300">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs */}
      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Ao Vivo</TabsTrigger>
          <TabsTrigger value="success">Sucesso ({stats.success})</TabsTrigger>
          <TabsTrigger value="errors">Erros ({stats.error})</TabsTrigger>
        </TabsList>

        {/* Live Tab */}
        <TabsContent value="live">
          <Card className="p-6 border-green-400/20">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 border rounded-lg transition ${
                      log.status === "success"
                        ? "border-cyan-400/30 hover:border-cyan-400/50 bg-cyan-400/5"
                        : log.status === "error"
                          ? "border-red-400/30 hover:border-red-400/50 bg-red-400/5"
                          : "border-yellow-400/30 hover:border-yellow-400/50 bg-yellow-400/5"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            log.status === "success"
                              ? "bg-cyan-400"
                              : log.status === "error"
                                ? "bg-red-400"
                                : "bg-yellow-400 animate-pulse"
                          }`}
                        />
                        <span className="font-semibold text-sm">{log.model}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          log.status === "success"
                            ? "bg-cyan-400/20 text-cyan-400"
                            : log.status === "error"
                              ? "bg-red-400/20 text-red-400"
                              : "bg-yellow-400/20 text-yellow-400"
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{log.diagnosis}</p>

                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Tempo:</span>
                        <p className="font-semibold text-blue-400">{log.processingTime}ms</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tokens:</span>
                        <p className="font-semibold text-green-400">{log.tokens}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo:</span>
                        <p className="font-semibold text-orange-400">${log.cost}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confiança:</span>
                        <p className="font-semibold text-purple-400">{log.confidence}%</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum log disponível</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Success Tab */}
        <TabsContent value="success">
          <Card className="p-6 border-green-400/20">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.filter((l) => l.status === "success").length > 0 ? (
                logs
                  .filter((l) => l.status === "success")
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border border-cyan-400/30 rounded-lg hover:border-cyan-400/50 bg-cyan-400/5 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-cyan-400">{log.model}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.diagnosis}</p>
                    </div>
                  ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum log de sucesso</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors">
          <Card className="p-6 border-green-400/20">
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.filter((l) => l.status === "error").length > 0 ? (
                logs
                  .filter((l) => l.status === "error")
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border border-red-400/30 rounded-lg hover:border-red-400/50 bg-red-400/5 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-red-400">{log.model}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.diagnosis}</p>
                    </div>
                  ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum erro registrado</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
