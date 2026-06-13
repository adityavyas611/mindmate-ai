"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-violet-50 dark:bg-violet-950/30 motion-reduce:animate-none"
      style={{ height }}
      role="status"
      aria-label="Loading chart"
    />
  );
}

export const MoodTrendChart = dynamic(
  () => import("./trend-charts").then((m) => m.MoodTrendChart),
  { loading: () => <ChartSkeleton height={300} /> }
);

export const WellnessScoreChart = dynamic(
  () => import("./trend-charts").then((m) => m.WellnessScoreChart),
  { loading: () => <ChartSkeleton height={250} /> }
);

export const SleepStudyChart = dynamic(
  () => import("./trend-charts").then((m) => m.SleepStudyChart),
  { loading: () => <ChartSkeleton height={250} /> }
);
