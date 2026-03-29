import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("logs router", () => {
  it("should list logs for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.logs.list({ limit: 10, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get log stats for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.logs.stats();

    expect(stats).toBeDefined();
    if (stats) {
      expect(stats.totalLogs).toBeGreaterThanOrEqual(0);
      expect(stats.totalTokens).toBeGreaterThanOrEqual(0);
      expect(stats.totalCost).toBeGreaterThanOrEqual(0);
      expect(stats.avgLatency).toBeGreaterThanOrEqual(0);
      expect(stats.avgConfidence).toBeGreaterThanOrEqual(0);
    }
  });

  it("should create a new log entry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logData = {
      modelo: "Test Model",
      categoria: "Test Category",
      prompt: "Test prompt",
      resposta: "Test response",
      latencia: 1.5,
      tokens: 100,
      custo: "0.01",
      status: "sucesso" as const,
      confianca: "0.95",
    };

    const result = await caller.logs.create(logData);

    expect(result).toBeDefined();
  });

  it("should get logs by date range", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const result = await caller.logs.byDateRange({
      startDate,
      endDate,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});
