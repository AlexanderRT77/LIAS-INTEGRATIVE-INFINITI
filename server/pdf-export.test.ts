import { describe, it, expect } from "vitest";
import { generateComparisonPDF, exportToCSV, exportToJSON } from "./pdf-export";
import type { AIModel, ComparisonData, RecommendationData } from "./pdf-export";

describe("PDF Export Functions", () => {
  const mockModels: AIModel[] = [
    {
      name: "Manus",
      acuracia: 9,
      coerencia: 8,
      profundidade: 7,
      velocidade: 2.5,
      custo: 0.1,
      seguranca: 9,
    },
    {
      name: "Claude 3.5",
      acuracia: 10,
      coerencia: 9,
      profundidade: 8,
      velocidade: 1.5,
      custo: 0.15,
      seguranca: 8,
    },
  ];

  const mockComparisonData: ComparisonData = {
    models: mockModels,
    selectedModels: ["Manus", "Claude 3.5"],
    timestamp: new Date("2026-03-25"),
    generatedBy: "Test User",
  };

  const mockRecommendations: RecommendationData = {
    bestQuality: { name: "Claude 3.5", score: 9 },
    bestCostBenefit: { name: "Manus", ratio: 80 },
    fastest: { name: "Claude 3.5", speed: 1.5 },
    mostEconomical: { name: "Manus", cost: 0.1 },
  };

  describe("generateComparisonPDF", () => {
    it("should generate a PDF buffer", async () => {
      const pdfBuffer = await generateComparisonPDF(
        mockComparisonData,
        mockRecommendations
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it("should generate a PDF with correct structure", async () => {
      const pdfBuffer = await generateComparisonPDF(
        mockComparisonData,
        mockRecommendations
      );

      const pdfString = pdfBuffer.toString("utf-8", 0, 100);
      expect(pdfString).toContain("%PDF");
    });

    it("should include recommendations in PDF", async () => {
      const pdfBuffer = await generateComparisonPDF(
        mockComparisonData,
        mockRecommendations
      );

      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });

    it("should handle multiple models", async () => {
      const multipleModels: AIModel[] = [
        ...mockModels,
        {
          name: "DeepSeek R1",
          acuracia: 9,
          coerencia: 7,
          profundidade: 6,
          velocidade: 2.0,
          custo: 0.12,
          seguranca: 9,
        },
      ];

      const comparisonData: ComparisonData = {
        ...mockComparisonData,
        models: multipleModels,
        selectedModels: ["Manus", "Claude 3.5", "DeepSeek R1"],
      };

      const pdfBuffer = await generateComparisonPDF(
        comparisonData,
        mockRecommendations
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it("should handle empty chart images", async () => {
      const pdfBuffer = await generateComparisonPDF(
        mockComparisonData,
        mockRecommendations,
        {}
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe("exportToCSV", () => {
    it("should generate valid CSV format", () => {
      const csv = exportToCSV(mockModels);

      expect(csv).toContain("Modelo");
      expect(csv).toContain("Acurácia");
      expect(csv).toContain("Coerência");
      expect(csv).toContain("Manus");
      expect(csv).toContain("Claude 3.5");
    });

    it("should have correct number of rows", () => {
      const csv = exportToCSV(mockModels);
      const rows = csv.split("\n");

      expect(rows.length).toBe(mockModels.length + 1);
    });

    it("should include all model data", () => {
      const csv = exportToCSV(mockModels);

      expect(csv).toContain("9");
      expect(csv).toContain("8");
      expect(csv).toContain("0.1");
      expect(csv).toContain("0.15");
    });

    it("should format numbers correctly", () => {
      const csv = exportToCSV(mockModels);

      expect(csv).toContain("2.50");
      expect(csv).toContain("1.50");
    });

    it("should handle custom filename", () => {
      const csv = exportToCSV(mockModels, "custom-name.csv");

      expect(csv).toContain("Modelo");
    });
  });

  describe("exportToJSON", () => {
    it("should generate valid JSON", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("generatedBy");
      expect(parsed).toHaveProperty("models");
      expect(parsed).toHaveProperty("recommendations");
    });

    it("should include all models", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed.models).toHaveLength(2);
      expect(parsed.models[0].name).toBe("Manus");
      expect(parsed.models[1].name).toBe("Claude 3.5");
    });

    it("should include selected models", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed.selectedModels).toContain("Manus");
      expect(parsed.selectedModels).toContain("Claude 3.5");
    });

    it("should include recommendations", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed.recommendations.bestQuality.name).toBe("Claude 3.5");
      expect(parsed.recommendations.bestCostBenefit.name).toBe("Manus");
      expect(parsed.recommendations.fastest.name).toBe("Claude 3.5");
      expect(parsed.recommendations.mostEconomical.name).toBe("Manus");
    });

    it("should include timestamp", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBeDefined();
      expect(new Date(parsed.timestamp)).toBeInstanceOf(Date);
    });

    it("should include generated by info", () => {
      const json = exportToJSON(mockComparisonData, mockRecommendations);
      const parsed = JSON.parse(json);

      expect(parsed.generatedBy).toBe("Test User");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single model", async () => {
      const singleModel: AIModel[] = [mockModels[0]];
      const comparisonData: ComparisonData = {
        models: singleModel,
        selectedModels: ["Manus"],
        timestamp: new Date(),
        generatedBy: "Test",
      };

      const pdfBuffer = await generateComparisonPDF(
        comparisonData,
        mockRecommendations
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it("should handle models with extreme values", () => {
      const extremeModels: AIModel[] = [
        {
          name: "Extreme High",
          acuracia: 10,
          coerencia: 10,
          profundidade: 10,
          velocidade: 0.1,
          custo: 0.01,
          seguranca: 10,
        },
        {
          name: "Extreme Low",
          acuracia: 1,
          coerencia: 1,
          profundidade: 1,
          velocidade: 10,
          custo: 1.0,
          seguranca: 1,
        },
      ];

      const csv = exportToCSV(extremeModels);

      expect(csv).toContain("10");
      expect(csv).toContain("1");
      expect(csv).toContain("0.10");
      expect(csv).toContain("1.00");
    });

    it("should handle special characters in model names", () => {
      const specialModels: AIModel[] = [
        {
          name: "Model & Special (v1.0)",
          acuracia: 8,
          coerencia: 7,
          profundidade: 6,
          velocidade: 2,
          custo: 0.1,
          seguranca: 8,
        },
      ];

      const csv = exportToCSV(specialModels);

      expect(csv).toContain("Model & Special (v1.0)");
    });
  });
});
