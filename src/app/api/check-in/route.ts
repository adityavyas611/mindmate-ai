import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  analyzeCheckIn,
  generateMindfulnessExercise,
  generateMotivation,
} from "@/lib/ai/openai";
import { checkInSchema } from "@/schemas";
import { CheckIn, UserProfile } from "@/models";
import { jsonOk, jsonError, handleApiError, validateUserIdHeader } from "@/lib/api-utils";
import { getDayOfWeek } from "@/lib/utils";
import {
  computeStudyStreak,
  mapEntriesForAI,
} from "@/lib/wellness";

export async function POST(request: NextRequest) {
  try {
    const headerUserId = validateUserIdHeader(request);
    const body = await request.json();
    const input = checkInSchema.parse(body);

    if (headerUserId && headerUserId !== input.userId) {
      return jsonError("User ID mismatch", 403);
    }

    await connectDB();

    const history = await CheckIn.find({ userId: input.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const historicalEntries = mapEntriesForAI(
      history.map((h) => ({ ...h, createdAt: new Date(h.createdAt) }))
    );

    const checkInContext = {
      journalEntry: input.journalEntry,
      moodScore: input.moodScore,
      energyLevel: input.energyLevel,
      sleepHours: input.sleepHours,
      studyHours: input.studyHours,
      examType: input.examType,
      daysRemaining: input.daysRemaining,
      confidenceLevel: input.confidenceLevel,
      anxietyLevel: input.anxietyLevel,
      dayOfWeek: getDayOfWeek(new Date()),
    };

    const analysis = await analyzeCheckIn(checkInContext, historicalEntries);

    const encryptedJournal = encrypt(input.journalEntry);

    const checkIn = await CheckIn.create({
      userId: input.userId,
      encryptedJournal,
      moodScore: input.moodScore,
      energyLevel: input.energyLevel,
      sleepHours: input.sleepHours,
      studyHours: input.studyHours,
      examType: input.examType,
      daysRemaining: input.daysRemaining,
      confidenceLevel: input.confidenceLevel,
      anxietyLevel: input.anxietyLevel,
      analysis,
    });

    await UserProfile.findOneAndUpdate(
      { userId: input.userId },
      { $set: { examType: input.examType } },
      { upsert: true }
    );

    const [mindfulness, motivation] = await Promise.all([
      generateMindfulnessExercise(checkInContext, analysis),
      generateMotivation(
        checkInContext,
        historicalEntries,
        computeStudyStreak(historicalEntries)
      ),
    ]);

    return jsonOk({
      id: checkIn._id.toString(),
      analysis,
      mindfulness,
      motivation,
      createdAt: checkIn.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) return jsonError("userId is required");

    const headerUserId = validateUserIdHeader(request);
    if (headerUserId && headerUserId !== userId) {
      return jsonError("User ID mismatch", 403);
    }

    await connectDB();

    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "30", 10),
      100
    );

    const checkIns = await CheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const decrypted = checkIns.map((c) => ({
      id: c._id.toString(),
      userId: c.userId,
      journalEntry: decrypt(c.encryptedJournal),
      moodScore: c.moodScore,
      energyLevel: c.energyLevel,
      sleepHours: c.sleepHours,
      studyHours: c.studyHours,
      examType: c.examType,
      daysRemaining: c.daysRemaining,
      confidenceLevel: c.confidenceLevel,
      anxietyLevel: c.anxietyLevel,
      analysis: c.analysis,
      createdAt: c.createdAt,
    }));

    return jsonOk(decrypted);
  } catch (error) {
    return handleApiError(error);
  }
}
