import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AIAnalysis } from "@/schemas";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EXAM_TYPES = [
  "JEE",
  "NEET",
  "UPSC",
  "CAT",
  "GATE",
  "CUET",
  "Board Exams",
] as const;

export const SAFETY_DISCLAIMER =
  "Neurora is not a therapist or medical professional. If feelings persist or become overwhelming, please speak with a trusted adult, counselor, or mental health professional.";

export const ESCALATION_MESSAGE =
  "We're concerned about how you're feeling. Please reach out to a trusted adult, school counselor, or mental health professional right away. If you're in immediate danger, contact local emergency services or a crisis helpline.";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function shouldShowEscalation(analysis: AIAnalysis | null | undefined): boolean {
  if (!analysis) return false;
  if (analysis.stressLevel === "severe") return true;
  return (
    analysis.earlyWarning?.triggered === true &&
    analysis.earlyWarning.severity === "severe"
  );
}
