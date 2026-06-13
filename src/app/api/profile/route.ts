import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { profileSchema } from "@/schemas";
import { UserProfile } from "@/models";
import {
  jsonOk,
  handleApiError,
  validateUserIdHeader,
  parseUserIdParam,
  validateUserIdAccess,
  parseJsonBody,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const parsed = parseUserIdParam(request.nextUrl.searchParams.get("userId"));
    if ("error" in parsed && parsed.error) return parsed.error;
    const userId = parsed.userId!;

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, userId);
    if (accessError) return accessError;

    await connectDB();
    const profile = await UserProfile.findOne({ userId }).lean();
    return jsonOk(profile ?? { userId, knownStressTriggers: [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const parsedBody = await parseJsonBody(request);
    if ("error" in parsedBody && parsedBody.error) return parsedBody.error;
    const input = profileSchema.parse(parsedBody.body);

    const headerUserId = validateUserIdHeader(request);
    const accessError = validateUserIdAccess(headerUserId, input.userId);
    if (accessError) return accessError;

    await connectDB();

    const profile = await UserProfile.findOneAndUpdate(
      { userId: input.userId },
      {
        $set: {
          ...(input.examType && { examType: input.examType }),
          ...(input.examGoal !== undefined && { examGoal: input.examGoal }),
          ...(input.motivationalPreferences !== undefined && {
            motivationalPreferences: input.motivationalPreferences,
          }),
          ...(input.knownStressTriggers && {
            knownStressTriggers: input.knownStressTriggers,
          }),
        },
      },
      { upsert: true, new: true }
    ).lean();

    return jsonOk(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
