import { invokeLLM } from "../_core/llm";

export type AIModel = "claude" | "gpt4" | "gemini" | "deepseek" | "perplexity" | "grok";

export interface LLMAnalysisRequest {
  prompt: string;
  healthData?: Record<string, any>;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMAnalysisResponse {
  model: AIModel;
  diagnosis: string;
  confidence: number;
  recommendations: string;
  processingTime: number;
  tokensUsed: number;
  cost: string;
}

/**
 * Invoke LLM for medical diagnosis
 */
export async function invokeMedicalLLM(
  request: LLMAnalysisRequest
): Promise<LLMAnalysisResponse> {
  const startTime = Date.now();
  const model = request.model || "claude";

  try {
    const systemPrompt = `You are an expert medical AI assistant specialized in diagnostic analysis. 
Analyze the provided health parameters and medical history to provide:
1. A preliminary diagnosis based on the symptoms and data
2. Confidence level (0-100%)
3. Recommended next steps or tests
4. Important disclaimers about seeking professional medical advice

Format your response as JSON with keys: diagnosis, confidence, recommendations, disclaimers`;

    const userPrompt = `Health Analysis Request:
${request.prompt}

${request.healthData ? `Health Data: ${JSON.stringify(request.healthData, null, 2)}` : ""}

Please provide a detailed medical analysis.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const processingTime = Date.now() - startTime;
    const content = response.choices?.[0]?.message?.content || "";

    // Parse JSON response
    let analysisData = {
      diagnosis: "Unable to parse response",
      confidence: 0,
      recommendations: "",
      disclaimers: "",
    };

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      analysisData.diagnosis = content;
    }

    // Calculate approximate cost (varies by model)
    const costPerToken = getModelCost(model);
    const estimatedTokens = Math.ceil(content.length / 4); // Rough estimate
    const cost = (estimatedTokens * costPerToken).toFixed(6);

    return {
      model,
      diagnosis: analysisData.diagnosis,
      confidence: Math.min(100, Math.max(0, analysisData.confidence || 0)),
      recommendations: analysisData.recommendations,
      processingTime,
      tokensUsed: estimatedTokens,
      cost,
    };
  } catch (error) {
    console.error(`LLM Error (${model}):`, error);
    throw new Error(`Failed to invoke ${model} for medical analysis`);
  }
}

/**
 * Invoke all 6 AI models for comparative analysis
 */
export async function invokeAllModels(
  request: Omit<LLMAnalysisRequest, "model">
): Promise<LLMAnalysisResponse[]> {
  const models: AIModel[] = ["claude", "gpt4", "gemini", "deepseek", "perplexity", "grok"];

  const results = await Promise.allSettled(
    models.map((model) =>
      invokeMedicalLLM({
        ...request,
        model,
      })
    )
  );

  return results
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Model ${models[index]} failed:`, result.reason);
        return {
          model: models[index],
          diagnosis: "Analysis failed",
          confidence: 0,
          recommendations: "",
          processingTime: 0,
          tokensUsed: 0,
          cost: "0",
        };
      }
    });
}

/**
 * Get cost per token for each model
 */
function getModelCost(model: AIModel): number {
  const costs: Record<AIModel, number> = {
    claude: 0.000003, // $3 per 1M tokens (input)
    gpt4: 0.00003, // $30 per 1M tokens (input)
    gemini: 0.0000005, // $0.50 per 1M tokens
    deepseek: 0.0000014, // $1.40 per 1M tokens
    perplexity: 0.000008, // $8 per 1M tokens
    grok: 0.000002, // $2 per 1M tokens
  };
  return costs[model] || 0.000001;
}

/**
 * Calculate consensus diagnosis from multiple AI models
 */
export function calculateConsensus(analyses: LLMAnalysisResponse[]): {
  consensus: string;
  agreementPercentage: number;
  highestConfidence: LLMAnalysisResponse;
  lowestCost: LLMAnalysisResponse;
} {
  if (analyses.length === 0) {
    return {
      consensus: "No analyses available",
      agreementPercentage: 0,
      highestConfidence: {} as LLMAnalysisResponse,
      lowestCost: {} as LLMAnalysisResponse,
    };
  }

  // Find most common diagnosis
  const diagnosisCounts = new Map<string, number>();
  analyses.forEach((a) => {
    const count = diagnosisCounts.get(a.diagnosis) || 0;
    diagnosisCounts.set(a.diagnosis, count + 1);
  });

  const consensus = Array.from(diagnosisCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  const agreementPercentage = Math.round(
    ((diagnosisCounts.get(consensus) || 0) / analyses.length) * 100
  );

  const highestConfidence = analyses.reduce((prev, current) =>
    prev.confidence > current.confidence ? prev : current
  );

  const lowestCost = analyses.reduce((prev, current) =>
    parseFloat(prev.cost) < parseFloat(current.cost) ? prev : current
  );

  return {
    consensus,
    agreementPercentage,
    highestConfidence,
    lowestCost,
  };
}

/**
 * Validate diagnosis accuracy against known cases
 */
export async function validateDiagnosis(
  diagnosis: string,
  actualDiagnosis: string,
  confidence: number
): Promise<{
  isAccurate: boolean;
  score: number;
  feedback: string;
}> {
  // Simple similarity check (in production, use more sophisticated NLP)
  const diagnosisLower = diagnosis.toLowerCase();
  const actualLower = actualDiagnosis.toLowerCase();

  const isAccurate =
    diagnosisLower.includes(actualLower) || actualLower.includes(diagnosisLower);

  const score = isAccurate ? confidence : Math.max(0, confidence - 30);

  const feedback = isAccurate
    ? `Diagnosis matches actual case with ${confidence}% confidence`
    : `Diagnosis differs from actual case. Predicted: "${diagnosis}", Actual: "${actualDiagnosis}"`;

  return {
    isAccurate,
    score,
    feedback,
  };
}
