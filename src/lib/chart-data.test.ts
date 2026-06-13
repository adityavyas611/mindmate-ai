import { describe, it, expect } from "vitest";
import {
  buildChartDataFromCheckIns,
  buildMoodChartDataFromCheckIns,
} from "@/lib/chart-data";

describe("buildChartDataFromCheckIns", () => {
  it("maps check-ins to chart points in chronological order", () => {
    const data = buildChartDataFromCheckIns([
      {
        createdAt: "2026-06-02",
        moodScore: 7,
        anxietyLevel: 4,
        confidenceLevel: 6,
        energyLevel: 6,
        sleepHours: 7,
        studyHours: 5,
        analysis: { wellnessScore: 72, stressPredictorScore: 30 },
      },
      {
        createdAt: "2026-06-01",
        moodScore: 5,
        anxietyLevel: 6,
        confidenceLevel: 5,
        energyLevel: 5,
        sleepHours: 6,
        studyHours: 4,
      },
    ]);

    expect(data).toHaveLength(2);
    expect(data[0].mood).toBe(5);
    expect(data[1].wellnessScore).toBe(72);
  });
});

describe("buildMoodChartDataFromCheckIns", () => {
  it("uses provided date formatter", () => {
    const data = buildMoodChartDataFromCheckIns(
      [
        {
          createdAt: "2026-06-01",
          moodScore: 6,
          anxietyLevel: 4,
          confidenceLevel: 7,
          energyLevel: 5,
        },
      ],
      (d) => `formatted-${d}`
    );
    expect(data[0].date).toBe("formatted-2026-06-01");
  });
});
