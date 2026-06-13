import { z } from "zod";
import { EXAM_TYPES } from "@/lib/utils";

const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

/** OpenAI JSON often returns null instead of omitting optional fields. */
const aiString = () => z.string().nullable().transform((v) => v ?? "");
const aiOptionalString = () =>
  z.string().nullable().optional().transform((v) => v ?? undefined);
const aiStringArray = () =>
  z.array(z.string()).nullable().transform((v) => v ?? []);

export const checkInSchema = z.object({
  userId: z.string().uuid(),
  journalEntry: trimmedString(1, 5000),
  moodScore: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  studyHours: z.number().min(0).max(24),
  examType: z.enum(EXAM_TYPES),
  daysRemaining: z.number().int().min(0).max(730),
  confidenceLevel: z.number().int().min(1).max(10),
  anxietyLevel: z.number().int().min(1).max(10),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const userIdSchema = z.object({
  userId: z.string().uuid(),
});

export const chatMessageSchema = z.object({
  userId: z.string().uuid(),
  message: trimmedString(1, 2000),
});

export const profileSchema = z.object({
  userId: z.string().uuid(),
  examType: z.enum(EXAM_TYPES).optional(),
  examGoal: z.string().trim().max(500).optional(),
  motivationalPreferences: z.string().trim().max(500).optional(),
  knownStressTriggers: z
    .array(z.string().trim().min(1).max(200))
    .max(20)
    .optional(),
});

export const aiAnalysisSchema = z.object({
  emotionalState: aiString(),
  stressLevel: z.enum(["low", "moderate", "high", "severe"]),
  burnoutRisk: z.enum(["low", "moderate", "high", "critical"]),
  motivationLevel: z.enum(["low", "moderate", "high"]),
  confidenceIndicators: aiString(),
  negativeSelfTalkPatterns: aiStringArray(),
  hiddenStressTriggers: aiStringArray(),
  recurringThemes: aiStringArray(),
  productivityImpact: aiString(),
  academicPressureIndicators: aiStringArray(),
  personalizedInsights: aiStringArray(),
  copingStrategies: aiStringArray(),
  encouragement: aiString(),
  wellnessScore: z.number().min(0).max(100),
  wellnessScoreExplanation: aiString(),
  improvementSuggestions: aiStringArray(),
  stressPredictorScore: z.number().min(0).max(100),
  stressPredictorExplanation: aiString(),
  earlyWarning: z
    .object({
      triggered: z.boolean(),
      severity: z.enum(["none", "mild", "moderate", "severe"]),
      message: aiString(),
    })
    .nullish()
    .transform((v) => v ?? undefined),
  safetyNote: aiString(),
});

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

export const mindfulnessExerciseSchema = z.object({
  title: aiString(),
  type: z.enum([
    "reset",
    "breathing",
    "grounding",
    "visualization",
    "exam_anxiety",
    "sleep_prep",
  ]),
  durationMinutes: z.number(),
  instructions: aiStringArray(),
  adaptationReason: aiString(),
});

export type MindfulnessExercise = z.infer<typeof mindfulnessExerciseSchema>;

export const motivationSchema = z.object({
  affirmation: aiString(),
  dailyEncouragement: aiString(),
  progressCelebration: aiOptionalString(),
  milestoneRecognition: aiOptionalString(),
});

export type MotivationContent = z.infer<typeof motivationSchema>;

export const patternInsightsSchema = z.object({
  weeklySummary: aiString(),
  monthlyReport: aiOptionalString(),
  moodTrend: z.enum(["improving", "stable", "declining"]),
  burnoutTrend: z.enum(["improving", "stable", "declining"]),
  anxietyTrend: z.enum(["improving", "stable", "declining"]),
  confidenceTrend: z.enum(["improving", "stable", "declining"]),
  sleepTrend: z.enum(["improving", "stable", "declining"]),
  studyConsistencyTrend: z.enum(["improving", "stable", "declining"]),
  correlations: z.array(
    z.object({
      relationship: aiString(),
      insight: aiString(),
      strength: z.enum(["weak", "moderate", "strong"]),
    })
  ),
  riskAlerts: z.array(
    z.object({
      type: aiString(),
      message: aiString(),
      severity: z.enum(["info", "warning", "critical"]),
    })
  ),
  discoveredPatterns: aiStringArray(),
});

export type PatternInsights = z.infer<typeof patternInsightsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
