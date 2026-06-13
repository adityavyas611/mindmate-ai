import { describe, it, expect } from "vitest";
import {
  computeWellnessScore,
  computeBurnoutRiskLevel,
  computeStudyStreak,
  computeLocalTrends,
} from "@/lib/wellness";
import type { HistoricalEntry } from "@/lib/ai/openai";

function makeEntry(overrides: Partial<HistoricalEntry> = {}): HistoricalEntry {
  return {
    date: "2026-06-01",
    moodScore: 6,
    energyLevel: 6,
    sleepHours: 7,
    studyHours: 6,
    confidenceLevel: 6,
    anxietyLevel: 4,
    examType: "JEE",
    daysRemaining: 90,
    ...overrides,
  };
}

describe("computeWellnessScore", () => {
  it("returns defaults for empty entries", () => {
    const result = computeWellnessScore([]);
    expect(result.overall).toBe(50);
    expect(result.explanation).toContain("first check-in");
  });

  it("computes score from recent entries", () => {
    const entries = [
      makeEntry({ moodScore: 8, sleepHours: 8, anxietyLevel: 3, confidenceLevel: 7 }),
      makeEntry({ moodScore: 7, sleepHours: 7, anxietyLevel: 4, confidenceLevel: 6 }),
    ];
    const result = computeWellnessScore(entries);
    expect(result.overall).toBeGreaterThan(50);
    expect(result.mood).toBeGreaterThan(0);
  });

  it("blends AI score when provided", () => {
    const entries = [makeEntry()];
    const withoutAi = computeWellnessScore(entries);
    const withAi = computeWellnessScore(entries, 90);
    expect(withAi.overall).not.toBe(withoutAi.overall);
  });
});

describe("computeBurnoutRiskLevel", () => {
  it("returns low for empty entries", () => {
    expect(computeBurnoutRiskLevel([])).toBe("low");
  });

  it("returns critical for high-risk patterns", () => {
    const entries = Array.from({ length: 5 }, () =>
      makeEntry({
        anxietyLevel: 9,
        energyLevel: 2,
        sleepHours: 4,
        studyHours: 12,
      })
    );
    expect(computeBurnoutRiskLevel(entries)).toBe("critical");
  });

  it("returns low for healthy patterns", () => {
    const entries = Array.from({ length: 5 }, () =>
      makeEntry({
        anxietyLevel: 3,
        energyLevel: 7,
        sleepHours: 8,
        studyHours: 5,
      })
    );
    expect(computeBurnoutRiskLevel(entries)).toBe("low");
  });
});

describe("computeStudyStreak", () => {
  it("counts consecutive study days", () => {
    const entries = [
      makeEntry({ studyHours: 6 }),
      makeEntry({ studyHours: 5 }),
      makeEntry({ studyHours: 1 }),
    ];
    expect(computeStudyStreak(entries)).toBe(2);
  });

  it("returns 0 when latest day has low study hours", () => {
    expect(computeStudyStreak([makeEntry({ studyHours: 1 })])).toBe(0);
  });
});

describe("computeLocalTrends", () => {
  it("returns stable for single entry", () => {
    const trends = computeLocalTrends([makeEntry()]);
    expect(trends.moodTrend).toBe("stable");
  });

  it("detects improving mood", () => {
    const entries = [
      makeEntry({ moodScore: 8 }),
      makeEntry({ moodScore: 8 }),
      makeEntry({ moodScore: 4 }),
      makeEntry({ moodScore: 4 }),
    ];
    expect(computeLocalTrends(entries).moodTrend).toBe("improving");
  });
});
