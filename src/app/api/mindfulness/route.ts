import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { generateMindfulnessExercise } from "@/lib/ai/openai";
import { userIdSchema } from "@/schemas";
import { CheckIn } from "@/models";
import {
  jsonOk,
  jsonError,
  handleApiError,
  validateUserIdHeader,
  validateUserIdAccess,
  applyRateLimit,
  parseJsonBody,
} from "@/lib/api-utils";
import { getDayOfWeek } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = applyRateLimit(request, "mindfulness-post", 10, 60_000);
    if (rateLimited) return rateLimited;

    const parsedBody = await parseJsonBody(request);
    if ("error" in parsedBody && parsedBody.error) return parsedBody.error;
    const { userId } = userIdSchema.parse(parsedBody.body);

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, userId);
    if (accessError) return accessError;

    await connectDB();

    const latest = await CheckIn.findOne({ userId }).sort({ createdAt: -1 }).lean();

    if (!latest || !latest.analysis) {
      return jsonError("Complete a check-in first to get personalized exercises", 400);
    }

    const context = {
      journalEntry: "",
      moodScore: latest.moodScore,
      energyLevel: latest.energyLevel,
      sleepHours: latest.sleepHours,
      studyHours: latest.studyHours,
      examType: latest.examType,
      daysRemaining: latest.daysRemaining,
      confidenceLevel: latest.confidenceLevel,
      anxietyLevel: latest.anxietyLevel,
      dayOfWeek: getDayOfWeek(new Date()),
    };

    const exercise = await generateMindfulnessExercise(context, {
      stressLevel: latest.analysis.stressLevel,
      burnoutRisk: latest.analysis.burnoutRisk,
    });

    return jsonOk(exercise);
  } catch (error) {
    return handleApiError(error);
  }
}
