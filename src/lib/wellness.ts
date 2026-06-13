import { average } from "@/lib/utils";
import type { HistoricalEntry } from "@/lib/ai/openai";

export interface WellnessScoreBreakdown {
  overall: number;
  mood: number;
  sleep: number;
  stress: number;
  confidence: number;
  consistency: number;
  explanation: string;
  suggestions: string[];
}

export function computeWellnessScore(
  entries: HistoricalEntry[],
  aiScore?: number
): WellnessScoreBreakdown {
  if (entries.length === 0) {
    return {
      overall: 50,
      mood: 50,
      sleep: 50,
      stress: 50,
      confidence: 50,
      consistency: 50,
      explanation: "Complete your first check-in to get a personalized wellness score.",
      suggestions: ["Start with today's emotional check-in"],
    };
  }

  const recent = entries.slice(0, 7);
  const moodAvg = average(recent.map((e) => e.moodScore));
  const sleepAvg = average(recent.map((e) => e.sleepHours));
  const anxietyAvg = average(recent.map((e) => e.anxietyLevel));
  const confidenceAvg = average(recent.map((e) => e.confidenceLevel));
  const studyAvg = average(recent.map((e) => e.studyHours));

  const moodScore = (moodAvg / 10) * 100;
  const sleepScore = Math.min((sleepAvg / 8) * 100, 100);
  const stressScore = ((10 - anxietyAvg) / 10) * 100;
  const confidenceScore = (confidenceAvg / 10) * 100;

  const studyValues = recent.map((e) => e.studyHours);
  const studyStdDev =
    studyValues.length > 1
      ? Math.sqrt(
          studyValues.reduce((sum, v) => sum + (v - studyAvg) ** 2, 0) /
            studyValues.length
        )
      : 0;
  const consistencyScore = Math.max(0, 100 - studyStdDev * 20);

  const computedOverall = Math.round(
    moodScore * 0.25 +
      sleepScore * 0.2 +
      stressScore * 0.2 +
      confidenceScore * 0.2 +
      consistencyScore * 0.15
  );

  const overall = aiScore
    ? Math.round(computedOverall * 0.6 + aiScore * 0.4)
    : computedOverall;

  const suggestions: string[] = [];
  if (sleepAvg < 6) suggestions.push("Aim for 7–8 hours of sleep to support focus and mood.");
  if (anxietyAvg > 6) suggestions.push("Try a 5-minute breathing exercise before study sessions.");
  if (confidenceAvg < 5) suggestions.push("Write down 3 things you understood well today.");
  if (studyStdDev > 3) suggestions.push("Build a consistent daily study routine, even on lighter days.");
  if (moodAvg < 5) suggestions.push("Schedule a short break or talk to someone you trust today.");

  return {
    overall: clampScore(overall),
    mood: clampScore(moodScore),
    sleep: clampScore(sleepScore),
    stress: clampScore(stressScore),
    confidence: clampScore(confidenceScore),
    consistency: clampScore(consistencyScore),
    explanation: `Based on your last ${recent.length} check-in(s): mood ${moodAvg.toFixed(1)}/10, sleep ${sleepAvg.toFixed(1)}h, anxiety ${anxietyAvg.toFixed(1)}/10, confidence ${confidenceAvg.toFixed(1)}/10.`,
    suggestions: suggestions.length > 0 ? suggestions : ["Keep up your check-in habit — consistency builds self-awareness."],
  };
}

function clampScore(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

export function computeStudyStreak(entries: HistoricalEntry[]): number {
  let streak = 0;
  for (const entry of entries) {
    if (entry.studyHours >= 2) streak++;
    else break;
  }
  return streak;
}

export function computeBurnoutRiskLevel(
  entries: HistoricalEntry[]
): "low" | "moderate" | "high" | "critical" {
  if (entries.length === 0) return "low";

  const recent = entries.slice(0, 7);
  const avgAnxiety = average(recent.map((e) => e.anxietyLevel));
  const avgEnergy = average(recent.map((e) => e.energyLevel));
  const avgSleep = average(recent.map((e) => e.sleepHours));
  const avgStudy = average(recent.map((e) => e.studyHours));

  let risk = 0;
  if (avgAnxiety >= 7) risk += 3;
  else if (avgAnxiety >= 5) risk += 1;
  if (avgEnergy <= 4) risk += 2;
  if (avgSleep < 6) risk += 2;
  if (avgStudy > 10) risk += 2;

  if (risk >= 6) return "critical";
  if (risk >= 4) return "high";
  if (risk >= 2) return "moderate";
  return "low";
}

export function computeLocalTrends(entries: HistoricalEntry[]): {
  moodTrend: "improving" | "stable" | "declining";
  anxietyTrend: "improving" | "stable" | "declining";
  confidenceTrend: "improving" | "stable" | "declining";
  sleepTrend: "improving" | "stable" | "declining";
  studyConsistencyTrend: "improving" | "stable" | "declining";
  burnoutTrend: "improving" | "stable" | "declining";
} {
  if (entries.length < 2) {
    return {
      moodTrend: "stable",
      anxietyTrend: "stable",
      confidenceTrend: "stable",
      sleepTrend: "stable",
      studyConsistencyTrend: "stable",
      burnoutTrend: "stable",
    };
  }

  const half = Math.ceil(entries.length / 2);
  const recent = entries.slice(0, half);
  const older = entries.slice(half);

  return {
    moodTrend: compareTrend(
      average(recent.map((e) => e.moodScore)),
      average(older.map((e) => e.moodScore))
    ),
    anxietyTrend: compareTrend(
      average(older.map((e) => e.anxietyLevel)),
      average(recent.map((e) => e.anxietyLevel))
    ),
    confidenceTrend: compareTrend(
      average(recent.map((e) => e.confidenceLevel)),
      average(older.map((e) => e.confidenceLevel))
    ),
    sleepTrend: compareTrend(
      average(recent.map((e) => e.sleepHours)),
      average(older.map((e) => e.sleepHours))
    ),
    studyConsistencyTrend: compareTrend(
      average(recent.map((e) => e.studyHours)),
      average(older.map((e) => e.studyHours))
    ),
    burnoutTrend: compareTrend(
      burnoutRiskScore(older),
      burnoutRiskScore(recent)
    ),
  };
}

function compareTrend(
  recent: number,
  older: number,
  threshold = 0.5
): "improving" | "stable" | "declining" {
  const diff = recent - older;
  if (diff > threshold) return "improving";
  if (diff < -threshold) return "declining";
  return "stable";
}

function burnoutRiskScore(entries: HistoricalEntry[]): number {
  return (
    average(entries.map((e) => e.anxietyLevel)) +
    (10 - average(entries.map((e) => e.energyLevel))) +
    Math.max(0, 6 - average(entries.map((e) => e.sleepHours)))
  );
}

export function mapEntriesForAI(
  entries: Array<{
    createdAt: Date;
    moodScore: number;
    energyLevel: number;
    sleepHours: number;
    studyHours: number;
    confidenceLevel: number;
    anxietyLevel: number;
    examType: string;
    daysRemaining: number;
    analysis?: { stressLevel?: string; burnoutRisk?: string };
  }>,
  journalSummaries?: Map<string, string>
): HistoricalEntry[] {
  return entries.map((e) => ({
    date: e.createdAt.toISOString().split("T")[0],
    moodScore: e.moodScore,
    energyLevel: e.energyLevel,
    sleepHours: e.sleepHours,
    studyHours: e.studyHours,
    confidenceLevel: e.confidenceLevel,
    anxietyLevel: e.anxietyLevel,
    examType: e.examType,
    daysRemaining: e.daysRemaining,
    journalSummary: journalSummaries?.get(e.createdAt.toISOString()),
    stressLevel: e.analysis?.stressLevel,
    burnoutRisk: e.analysis?.burnoutRisk,
  }));
}
