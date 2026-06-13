import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MoodTrendChart,
  WellnessScoreChart,
  SleepStudyChart,
} from "@/components/charts/trend-charts";

const sampleData = [
  { date: "Jun 1", mood: 6, anxiety: 4, confidence: 7, sleep: 7, study: 6 },
  { date: "Jun 2", mood: 7, anxiety: 3, confidence: 8, sleep: 8, study: 5 },
];

describe("trend charts accessibility", () => {
  it("MoodTrendChart has descriptive aria-label", () => {
    render(<MoodTrendChart data={sampleData} />);
    expect(
      screen.getByRole("img", {
        name: /mood, anxiety, and confidence trends/i,
      })
    ).toBeInTheDocument();
  });

  it("WellnessScoreChart has descriptive aria-label", () => {
    render(
      <WellnessScoreChart
        data={sampleData.map((d) => ({
          ...d,
          wellnessScore: 75,
          stressPredictor: 30,
        }))}
      />
    );
    expect(
      screen.getByRole("img", { name: /wellness score and stress predictor/i })
    ).toBeInTheDocument();
  });

  it("SleepStudyChart has descriptive aria-label", () => {
    render(<SleepStudyChart data={sampleData} />);
    expect(
      screen.getByRole("img", { name: /sleep and study hours/i })
    ).toBeInTheDocument();
  });

  it("returns null for empty data", () => {
    const { container } = render(<MoodTrendChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
