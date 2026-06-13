import type { AIAnalysis, MindfulnessExercise, MotivationContent, PatternInsights } from "@/schemas";
import type { ChartDataPoint } from "@/lib/chart-data";
import type { WellnessScoreBreakdown, LocalRiskAlert } from "@/lib/wellness";

export interface CheckInRecord {
  id: string;
  userId: string;
  journalEntry: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  confidenceLevel: number;
  anxietyLevel: number;
  examType: string;
  daysRemaining: number;
  analysis?: AIAnalysis;
  createdAt: string;
}

export interface InsightsResponse {
  wellnessScore: WellnessScoreBreakdown;
  burnoutLevel: string;
  latestAnalysis: AIAnalysis | null;
  patternInsights: PatternInsights | null;
  localTrends: {
    moodTrend: string;
    burnoutTrend: string;
    anxietyTrend: string;
    confidenceTrend: string;
    sleepTrend: string;
    studyConsistencyTrend: string;
  };
  chartData: ChartDataPoint[];
  totalCheckIns: number;
  localRiskAlerts: LocalRiskAlert[];
}

export interface CheckInSubmitResponse {
  id: string;
  analysis: AIAnalysis;
  mindfulness: MindfulnessExercise;
  motivation: MotivationContent;
  createdAt: string;
}

export function trendBadgeVariant(
  trend: string
): "success" | "warning" | "danger" | "info" {
  if (trend === "improving") return "success";
  if (trend === "declining") return "danger";
  return "info";
}

export function severityBadgeVariant(
  level: string
): "success" | "warning" | "danger" {
  if (level === "low") return "success";
  if (level === "moderate") return "warning";
  return "danger";
}

export function scoreBadgeVariant(value: string): "success" | "warning" | "danger" {
  if (!value.includes("/100")) return severityBadgeVariant(value);
  const score = parseInt(value, 10);
  if (score > 70) return "success";
  if (score > 40) return "warning";
  return "danger";
}
