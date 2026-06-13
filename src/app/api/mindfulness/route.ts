import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { generateMindfulnessExercise } from "@/lib/ai/openai";
import { userIdSchema } from "@/schemas";
import { CheckIn } from "@/models";
import { jsonOk, jsonError, handleApiError, validateUserIdHeader } from "@/lib/api-utils";
import { getDayOfWeek } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = userIdSchema.parse(body);

    const headerUserId = validateUserIdHeader(request);
    if (headerUserId && headerUserId !== userId) {
      return jsonError("User ID mismatch", 403);
    }

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
