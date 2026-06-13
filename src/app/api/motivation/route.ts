import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { generateMotivation } from "@/lib/ai/openai";
import { userIdSchema } from "@/schemas";
import { CheckIn } from "@/models";
import {
  jsonOk,
  handleApiError,
  validateUserIdHeader,
  validateUserIdAccess,
  applyRateLimit,
  parseJsonBody,
} from "@/lib/api-utils";
import { computeStudyStreak, mapEntriesForAI } from "@/lib/wellness";
import { getDayOfWeek } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = applyRateLimit(request, "motivation-post", 10, 60_000);
    if (rateLimited) return rateLimited;

    const parsedBody = await parseJsonBody(request);
    if ("error" in parsedBody && parsedBody.error) return parsedBody.error;
    const { userId } = userIdSchema.parse(parsedBody.body);

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, userId);
    if (accessError) return accessError;

    await connectDB();

    const checkIns = await CheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(14)
      .lean();

    const entries = mapEntriesForAI(
      checkIns.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }))
    );

    const latest = checkIns[0];
    const context = latest
      ? {
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
        }
      : {
          journalEntry: "",
          moodScore: 5,
          energyLevel: 5,
          sleepHours: 7,
          studyHours: 4,
          examType: "JEE",
          daysRemaining: 90,
          confidenceLevel: 5,
          anxietyLevel: 5,
          dayOfWeek: getDayOfWeek(new Date()),
        };

    const motivation = await generateMotivation(
      context,
      entries,
      computeStudyStreak(entries)
    );

    return jsonOk(motivation);
  } catch (error) {
    return handleApiError(error);
  }
}
