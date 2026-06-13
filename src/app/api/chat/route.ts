import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { chatWithCoach } from "@/lib/ai/openai";
import { chatMessageSchema } from "@/schemas";
import { CheckIn, ChatMessage, UserProfile } from "@/models";
import { jsonOk, jsonError, handleApiError, validateUserIdHeader } from "@/lib/api-utils";
import { mapEntriesForAI } from "@/lib/wellness";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = chatMessageSchema.parse(body);

    const headerUserId = validateUserIdHeader(request);
    if (headerUserId && headerUserId !== userId) {
      return jsonError("User ID mismatch", 403);
    }

    await connectDB();

    const [profile, recentCheckIns, chatHistory] = await Promise.all([
      UserProfile.findOne({ userId }).lean(),
      CheckIn.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      ChatMessage.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    const recentHistory = mapEntriesForAI(
      recentCheckIns.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }))
    );

    const historyMessages = chatHistory
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const reply = await chatWithCoach(message, {
      profile: profile
        ? {
            examType: profile.examType,
            examGoal: profile.examGoal,
            stressTriggers: profile.knownStressTriggers,
          }
        : undefined,
      recentHistory,
      chatHistory: historyMessages,
    });

    await ChatMessage.insertMany([
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: reply },
    ]);

    return jsonOk({ reply });
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

    const messages = await ChatMessage.find({ userId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return jsonOk(
      messages.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
