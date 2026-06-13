import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { generatePatternInsights } from "@/lib/ai/openai";
import { userIdSchema } from "@/schemas";
import { CheckIn } from "@/models";
import {
  jsonOk,
  jsonError,
  handleApiError,
  validateUserIdHeader,
  parseUserIdParam,
  validateUserIdAccess,
  applyRateLimit,
} from "@/lib/api-utils";
import {
  computeWellnessScore,
  computeBurnoutRiskLevel,
  computeLocalTrends,
  mapEntriesForAI,
} from "@/lib/wellness";
import { buildChartDataFromCheckIns } from "@/lib/chart-data";

export async function GET(request: NextRequest) {
  try {
    const parsed = parseUserIdParam(request.nextUrl.searchParams.get("userId"));
    if ("error" in parsed && parsed.error) return parsed.error;
    const userId = parsed.userId!;

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, userId);
    if (accessError) return accessError;

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
    const patternInsights = null;

    const chartData = buildChartDataFromCheckIns(
      checkIns.map((c) => ({
        createdAt: c.createdAt,
        moodScore: c.moodScore,
        anxietyLevel: c.anxietyLevel,
        confidenceLevel: c.confidenceLevel,
        energyLevel: c.energyLevel,
        sleepHours: c.sleepHours,
        studyHours: c.studyHours,
        analysis: c.analysis as { wellnessScore?: number; stressPredictorScore?: number } | undefined,
      }))
    );

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
    const rateLimited = applyRateLimit(request, "insights-post", 5, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { userId } = userIdSchema.parse(body);

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, userId);
    if (accessError) return accessError;

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
