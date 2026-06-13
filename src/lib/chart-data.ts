export interface ChartDataPoint {
  date: string;
  mood?: number | null;
  anxiety?: number | null;
  confidence?: number | null;
  energy?: number | null;
  sleep?: number | null;
  study?: number | null;
  wellnessScore?: number | null;
  stressPredictor?: number | null;
}

export function buildChartDataFromCheckIns(
  checkIns: Array<{
    createdAt: Date | string;
    moodScore: number;
    anxietyLevel: number;
    confidenceLevel: number;
    energyLevel: number;
    sleepHours: number;
    studyHours: number;
    analysis?: { wellnessScore?: number; stressPredictorScore?: number } | null;
  }>
): ChartDataPoint[] {
  return checkIns
    .slice()
    .reverse()
    .map((c) => ({
      date: new Date(c.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      mood: c.moodScore,
      anxiety: c.anxietyLevel,
      confidence: c.confidenceLevel,
      energy: c.energyLevel,
      sleep: c.sleepHours,
      study: c.studyHours,
      wellnessScore: c.analysis?.wellnessScore ?? null,
      stressPredictor: c.analysis?.stressPredictorScore ?? null,
    }));
}

export function buildMoodChartDataFromCheckIns(
  checkIns: Array<{
    createdAt: Date | string;
    moodScore: number;
    anxietyLevel: number;
    confidenceLevel: number;
    energyLevel: number;
  }>,
  formatDateFn: (date: Date | string) => string
): ChartDataPoint[] {
  return [...checkIns].reverse().map((c) => ({
    date: formatDateFn(c.createdAt),
    mood: c.moodScore,
    anxiety: c.anxietyLevel,
    confidence: c.confidenceLevel,
    energy: c.energyLevel,
  }));
}
