import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { generatePatternInsights } from "@/lib/ai/openai";
import { userIdSchema } from "@/schemas";
import { CheckIn } from "@/models";
import { jsonOk, jsonError, handleApiError, validateUserIdHeader } from "@/lib/api-utils";
import {
  computeWellnessScore,
  computeBurnoutRiskLevel,
  computeLocalTrends,
  mapEntriesForAI,
} from "@/lib/wellness";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) return jsonError("userId is required");

    const headerUserId = validateUserIdHeader(request);
    if (headerUserId && headerUserId !== userId) {
      return jsonError("User ID mismatch", 403);
    }

    await connectDB();

    const checkIns = await CheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const entries = mapEntriesForAI(
      checkIns.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        analysis: c.analysis as { stressLevel?: string; burnoutRisk?: string } | undefined,
      }))
    );

    const wellnessScore = computeWellnessScore(
      entries,
      checkIns[0]?.analysis?.wellnessScore
    );

    const burnoutLevel = computeBurnoutRiskLevel(entries);
    const localTrends = computeLocalTrends(entries);

    const latestAnalysis = checkIns[0]?.analysis ?? null;

    // Pattern insights are generated on-demand via POST to avoid costly AI calls on every page load
    const patternInsights = null;

    const chartData = checkIns
      .slice()
      .reverse()
      .map((c) => ({
        date: new Date(c.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        mood: c.moodScore,
        anxiety: c.anxietyLevel,
        confidence: c.confidenceLevel,
        energy: c.energyLevel,
        sleep: c.sleepHours,
        study: c.studyHours,
        wellnessScore: (c.analysis as { wellnessScore?: number } | undefined)?.wellnessScore ?? null,
        stressPredictor: (c.analysis as { stressPredictorScore?: number } | undefined)?.stressPredictorScore ?? null,
      }));

    return jsonOk({
      wellnessScore,
      burnoutLevel,
      latestAnalysis,
      patternInsights,
      localTrends,
      chartData,
      totalCheckIns: checkIns.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = userIdSchema.parse(body);

    const headerUserId = validateUserIdHeader(request);
    if (headerUserId && headerUserId !== userId) {
      return jsonError("User ID mismatch", 403);
    }

    await connectDB();

    const checkIns = await CheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const entries = mapEntriesForAI(
      checkIns.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }))
    );

    if (entries.length < 2) {
      return jsonError("At least 2 check-ins required for pattern analysis", 400);
    }

    const patternInsights = await generatePatternInsights(entries);
    return jsonOk(patternInsights);
  } catch (error) {
    return handleApiError(error);
  }
}
