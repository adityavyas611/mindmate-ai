import { describe, it, expect } from "vitest";
import { parseAIResponse } from "@/lib/ai/parse-response";
import { aiAnalysisSchema } from "@/schemas";

describe("parseAIResponse", () => {
  it("parses plain JSON", () => {
    const result = parseAIResponse<{ ok: boolean }>('{"ok": true}');
    expect(result.ok).toBe(true);
  });

  it("strips markdown code fences", () => {
    const raw = '```json\n{"emotionalState": "calm"}\n```';
    const result = parseAIResponse<{ emotionalState: string }>(raw);
    expect(result.emotionalState).toBe("calm");
  });

  it("parses and validates AI analysis shape", () => {
    const raw = JSON.stringify({
      emotionalState: "focused",
      stressLevel: "moderate",
      burnoutRisk: "low",
      motivationLevel: "high",
      confidenceIndicators: "steady progress",
      negativeSelfTalkPatterns: [],
      hiddenStressTriggers: [],
      recurringThemes: [],
      productivityImpact: "minimal",
      academicPressureIndicators: [],
      personalizedInsights: ["Keep going"],
      copingStrategies: ["Take breaks"],
      encouragement: "You are doing well",
      wellnessScore: 75,
      wellnessScoreExplanation: "Good balance",
      improvementSuggestions: ["Sleep more"],
      stressPredictorScore: 30,
      stressPredictorExplanation: "Low risk",
      safetyNote: "Seek help if needed",
    });
    const parsed = aiAnalysisSchema.parse(parseAIResponse(raw));
    expect(parsed.stressLevel).toBe("moderate");
    expect(parsed.wellnessScore).toBe(75);
  });
});
