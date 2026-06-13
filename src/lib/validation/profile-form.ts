import { profileSchema, type ProfileInput } from "@/schemas";
import { z } from "zod";

export type ProfileFormValues = Omit<ProfileInput, "userId"> & {
  stressTriggersText?: string;
};

export type ProfileValidationResult = z.SafeParseReturnType<ProfileInput, ProfileInput>;

export function buildProfilePayload(
  userId: string,
  values: ProfileFormValues
): ProfileValidationResult {
  const triggers = values.stressTriggersText
    ? values.stressTriggersText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : values.knownStressTriggers;

  return profileSchema.safeParse({
    userId,
    examType: values.examType,
    examGoal: values.examGoal?.trim() || undefined,
    motivationalPreferences: values.motivationalPreferences?.trim() || undefined,
    knownStressTriggers: triggers?.length ? triggers : undefined,
  });
}

export function formatProfileValidationErrors(
  result: Extract<ProfileValidationResult, { success: false }>
): string {
  return result.error.errors.map((e) => e.message).join(". ");
}
