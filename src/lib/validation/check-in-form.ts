import { checkInSchema, type CheckInInput } from "@/schemas";
import type { z } from "zod";
import { EXAM_TYPES } from "@/lib/utils";

export interface CheckInFormValues {
  userId: string;
  journalEntry: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  examType: string;
  daysRemaining: number;
  confidenceLevel: number;
  anxietyLevel: number;
}

export type CheckInValidationResult = z.SafeParseReturnType<
  CheckInInput,
  CheckInInput
>;

export function validateCheckInForm(
  values: CheckInFormValues
): CheckInValidationResult {
  return checkInSchema.safeParse({
    ...values,
    examType: values.examType as (typeof EXAM_TYPES)[number],
  });
}

export function formatCheckInValidationErrors(
  result: Extract<CheckInValidationResult, { success: false }>
): string {
  return result.error.errors.map((e) => e.message).join(". ");
}
