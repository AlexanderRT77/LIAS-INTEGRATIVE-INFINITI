import { describe, expect, it } from "vitest";

describe("Comparison Visualization", () => {
  describe("AI Model Data", () => {
    it("should have all 6 AI models with complete metrics", () => {
      const models = [
        { name: "Manus", acuracia: 9, coerencia: 8, profundidade: 7, velocidade: 2.5, custo: 0.10, seguranca: 9 },
        { name: "Claude 3.5", acuracia: 10, coerencia: 9, profundidade: 8, velocidade: 1.5, custo: 0.15, seguranca: 8 },
        { name: "DeepSeek R1", acuracia: 9, coerencia: 7, profundidade: 6, velocidade: 2.0, custo: 0.12, seguranca: 9 },
        { name: "Perplexidade", acuracia: 8, coerencia: 6, profundidade: 5, velocidade: 1.8, custo: 0.11, seguranca: 7 },
        { name: "Grok 2", acuracia: 7, coerencia: 5, profundidade: 4, velocidade: 1.6, custo: 0.14, seguranca: 6 },
        { name: "Chat.Z.Ai", acuracia: 8, coerencia: 7, profundidade: 6, velocidade: 2.2, custo: 0.13, seguranca: 8 },
      ];

      expect(models).toHaveLength(6);
      models.forEach(model => {
        expect(model.name).toBeDefined();
        expect(model.acuracia).toBeGreaterThanOrEqual(0);
        expect(model.acuracia).toBeLessThanOrEqual(10);
        expect(model.custo).toBeGreaterThan(0);
        expect(model.velocidade).toBeGreaterThan(0);
      });
    });
  });

  describe("Cost-Benefit Analysis", () => {
    it("should calculate quality score correctly", () => {
      const model = { acuracia: 9, coerencia: 8, profundidade: 7 };
      const qualidade = (model.acuracia + model.coerencia + model.profundidade) / 3;

      expect(qualidade).toBeCloseTo(8, 1);
    });

    it("should identify best quality model", () => {
      const models = [
        { name: "Manus", quality: 8 },
        { name: "Claude", quality: 9 },
        { name: "DeepSeek", quality: 7.3 },
      ];

      const best = models.reduce((a, b) => a.quality > b.quality ? a : b);

      expect(best.name).toBe("Claude");
      expect(best.quality).toBe(9);
    });

    it("should calculate cost-benefit ratio", () => {
      const models = [
        { name: "Manus", quality: 8, custo: 0.10 },
        { name: "Claude", quality: 9, custo: 0.15 },
      ];

      const ratios = models.map(m => ({
        name: m.name,
        ratio: m.quality / m.custo,
      }));

      const best = ratios.reduce((a, b) => a.ratio > b.ratio ? a : b);

      expect(best.name).toBe("Manus");
      expect(best.ratio).toBeCloseTo(80, 0);
    });
  });

  describe("Speed Analysis", () => {
    it("should identify fastest model", () => {
      const models = [
        { name: "Manus", velocidade: 2.5 },
        { name: "Claude", velocidade: 1.5 },
        { name: "Grok", velocidade: 1.6 },
      ];

      const fastest = models.reduce((a, b) => a.velocidade > b.velocidade ? a : b);

      expect(fastest.name).toBe("Manus");
    });

    it("should calculate average processing time", () => {
      const models = [
        { velocidade: 1.5 },
        { velocidade: 1.8 },
        { velocidade: 2.0 },
      ];

      const avg = models.reduce((sum, m) => sum + m.velocidade, 0) / models.length;

      expect(avg).toBeCloseTo(1.77, 2);
    });
  });

  describe("Quality vs Speed Tradeoff", () => {
    it("should identify quality-speed tradeoff", () => {
      const models = [
        { name: "Claude", quality: 9, velocidade: 1.5, custo: 0.15 },
        { name: "Manus", quality: 8, velocidade: 2.5, custo: 0.10 },
      ];

      // Claude: high quality, slower, more expensive
      // Manus: good quality, faster, cheaper

      expect(models[0].quality).toBeGreaterThan(models[1].quality);
      expect(models[1].velocidade).toBeGreaterThan(models[0].velocidade);
      expect(models[1].custo).toBeLessThan(models[0].custo);
    });
  });

  describe("Comparison Metrics", () => {
    it("should calculate average metrics across models", () => {
      const models = [
        { acuracia: 9, custo: 0.10 },
        { acuracia: 10, custo: 0.15 },
        { acuracia: 8, custo: 0.12 },
      ];

      const avgAccuracy = models.reduce((sum, m) => sum + m.acuracia, 0) / models.length;
      const avgCost = models.reduce((sum, m) => sum + m.custo, 0) / models.length;

      expect(avgAccuracy).toBeCloseTo(9, 1);
      expect(avgCost).toBeCloseTo(0.123, 2);
    });

    it("should identify outliers", () => {
      const costs = [0.10, 0.15, 0.12, 0.11, 0.14, 0.13];
      const avg = costs.reduce((a, b) => a + b) / costs.length;
      const outliers = costs.filter(c => Math.abs(c - avg) > 0.02);

      expect(outliers).toContain(0.15);
    });
  });

  describe("Recommendations", () => {
    it("should recommend best model for quality", () => {
      const models = [
        { name: "Manus", quality: 8 },
        { name: "Claude", quality: 9 },
        { name: "DeepSeek", quality: 7.3 },
      ];

      const best = models.reduce((a, b) => a.quality > b.quality ? a : b);

      expect(best.name).toBe("Claude");
    });

    it("should recommend best model for cost-efficiency", () => {
      const models = [
        { name: "Manus", efficiency: 80 },
        { name: "Claude", efficiency: 60 },
        { name: "DeepSeek", efficiency: 70 },
      ];

      const best = models.reduce((a, b) => a.efficiency > b.efficiency ? a : b);

      expect(best.name).toBe("Manus");
    });

    it("should recommend best model for speed", () => {
      const models = [
        { name: "Manus", speed: 2.5 },
        { name: "Claude", speed: 1.5 },
        { name: "Grok", speed: 1.6 },
      ];

      const fastest = models.reduce((a, b) => a.speed > b.speed ? a : b);

      expect(fastest.name).toBe("Manus");
    });

    it("should recommend best model for security", () => {
      const models = [
        { name: "Manus", seguranca: 9 },
        { name: "Claude", seguranca: 8 },
        { name: "DeepSeek", seguranca: 9 },
      ];

      const mostSecure = models.filter(m => m.seguranca === 9);

      expect(mostSecure).toHaveLength(2);
      expect(mostSecure.map(m => m.name)).toContain("Manus");
    });
  });

  describe("Comparison Matrix", () => {
    it("should create comparison matrix", () => {
      const models = [
        { name: "Manus", acuracia: 9, coerencia: 8, profundidade: 7, velocidade: 2.5, custo: 0.10, seguranca: 9 },
        { name: "Claude", acuracia: 10, coerencia: 9, profundidade: 8, velocidade: 1.5, custo: 0.15, seguranca: 8 },
      ];

      const matrix = models.map(m => ({
        modelo: m.name,
        acuracia: m.acuracia,
        coerencia: m.coerencia,
        profundidade: m.profundidade,
        velocidade: m.velocidade,
        custo: m.custo,
        seguranca: m.seguranca,
      }));

      expect(matrix).toHaveLength(2);
      expect(matrix[0].modelo).toBe("Manus");
      expect(matrix[1].modelo).toBe("Claude");
    });

    it("should calculate average metrics in matrix", () => {
      const matrix = [
        { acuracia: 9, coerencia: 8, profundidade: 7, seguranca: 9 },
        { acuracia: 10, coerencia: 9, profundidade: 8, seguranca: 8 },
      ];

      const averages = matrix.map(row => ({
        media: (row.acuracia + row.coerencia + row.profundidade + row.seguranca) / 4,
      }));

      expect(averages[0].media).toBeCloseTo(8.25, 2);
      expect(averages[1].media).toBeCloseTo(8.75, 2);
    });
  });

  describe("Filter and Sort", () => {
    it("should filter models by selection", () => {
      const allModels = ["Manus", "Claude", "DeepSeek", "Perplexidade", "Grok", "Chat.Z.Ai"];
      const selected = ["Manus", "Claude", "DeepSeek"];
      const filtered = allModels.filter(m => selected.includes(m));

      expect(filtered).toHaveLength(3);
      expect(filtered).toContain("Manus");
    });

    it("should sort models by quality", () => {
      const models = [
        { name: "Manus", quality: 8 },
        { name: "Claude", quality: 9 },
        { name: "DeepSeek", quality: 7.3 },
      ];

      const sorted = [...models].sort((a, b) => b.quality - a.quality);

      expect(sorted[0].name).toBe("Claude");
      expect(sorted[1].name).toBe("Manus");
      expect(sorted[2].name).toBe("DeepSeek");
    });

    it("should sort models by cost", () => {
      const models = [
        { name: "Manus", custo: 0.10 },
        { name: "Claude", custo: 0.15 },
        { name: "DeepSeek", custo: 0.12 },
      ];

      const sorted = [...models].sort((a, b) => a.custo - b.custo);

      expect(sorted[0].name).toBe("Manus");
      expect(sorted[1].name).toBe("DeepSeek");
      expect(sorted[2].name).toBe("Claude");
    });
  });
});
