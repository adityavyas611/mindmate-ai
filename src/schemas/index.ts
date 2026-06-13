import { z } from "zod";
import { EXAM_TYPES } from "@/lib/utils";

const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

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
  emotionalState: z.string(),
  stressLevel: z.enum(["low", "moderate", "high", "severe"]),
  burnoutRisk: z.enum(["low", "moderate", "high", "critical"]),
  motivationLevel: z.enum(["low", "moderate", "high"]),
  confidenceIndicators: z.string(),
  negativeSelfTalkPatterns: z.array(z.string()),
  hiddenStressTriggers: z.array(z.string()),
  recurringThemes: z.array(z.string()),
  productivityImpact: z.string(),
  academicPressureIndicators: z.array(z.string()),
  personalizedInsights: z.array(z.string()),
  copingStrategies: z.array(z.string()),
  encouragement: z.string(),
  wellnessScore: z.number().min(0).max(100),
  wellnessScoreExplanation: z.string(),
  improvementSuggestions: z.array(z.string()),
  stressPredictorScore: z.number().min(0).max(100),
  stressPredictorExplanation: z.string(),
  earlyWarning: z
    .object({
      triggered: z.boolean(),
      severity: z.enum(["none", "mild", "moderate", "severe"]),
      message: z.string(),
    })
    .optional(),
  safetyNote: z.string(),
});

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

export const mindfulnessExerciseSchema = z.object({
  title: z.string(),
  type: z.enum([
    "reset",
    "breathing",
    "grounding",
    "visualization",
    "exam_anxiety",
    "sleep_prep",
  ]),
  durationMinutes: z.number(),
  instructions: z.array(z.string()),
  adaptationReason: z.string(),
});

export type MindfulnessExercise = z.infer<typeof mindfulnessExerciseSchema>;

export const motivationSchema = z.object({
  affirmation: z.string(),
  dailyEncouragement: z.string(),
  progressCelebration: z.string().optional(),
  milestoneRecognition: z.string().optional(),
});

export type MotivationContent = z.infer<typeof motivationSchema>;

export const patternInsightsSchema = z.object({
  weeklySummary: z.string(),
  monthlyReport: z.string().optional(),
  moodTrend: z.enum(["improving", "stable", "declining"]),
  burnoutTrend: z.enum(["improving", "stable", "declining"]),
  anxietyTrend: z.enum(["improving", "stable", "declining"]),
  confidenceTrend: z.enum(["improving", "stable", "declining"]),
  sleepTrend: z.enum(["improving", "stable", "declining"]),
  studyConsistencyTrend: z.enum(["improving", "stable", "declining"]),
  correlations: z.array(
    z.object({
      relationship: z.string(),
      insight: z.string(),
      strength: z.enum(["weak", "moderate", "strong"]),
    })
  ),
  riskAlerts: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
      severity: z.enum(["info", "warning", "critical"]),
    })
  ),
  discoveredPatterns: z.array(z.string()),
});

export type PatternInsights = z.infer<typeof patternInsightsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
