"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  AlertBanner,
} from "@/components/shared/page-components";
import { MoodTrendChart, SleepStudyChart } from "@/components/charts/trend-charts";
import { api, useUserId } from "@/hooks/use-user-id";
import type { PatternInsights } from "@/schemas";
import type { WellnessScoreBreakdown } from "@/lib/wellness";
import { RefreshCw } from "lucide-react";

interface InsightsData {
  wellnessScore: WellnessScoreBreakdown;
  burnoutLevel: string;
  patternInsights: PatternInsights | null;
  localTrends: {
    moodTrend: string;
    burnoutTrend: string;
    anxietyTrend: string;
    confidenceTrend: string;
    sleepTrend: string;
    studyConsistencyTrend: string;
  };
  chartData: Array<Record<string, unknown>>;
  totalCheckIns: number;
}

function trendBadge(trend: string) {
  if (trend === "improving") return "success" as const;
  if (trend === "declining") return "danger" as const;
  return "info" as const;
}

export default function InsightsPage() {
  const userId = useUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => api.getInsights(userId!) as Promise<InsightsData>,
    enabled: !!userId,
  });

  const patternMutation = useMutation({
    mutationFn: () =>
      api.generatePatternInsights(userId!) as Promise<PatternInsights>,
  });

  const patternInsights = patternMutation.data ?? data?.patternInsights;
  const trends = patternInsights ?? data?.localTrends;

  if (!userId || isLoading) return <LoadingState message="Discovering your patterns..." />;

  if (!data || data.totalCheckIns === 0) {
    return (
      <div>
        <PageHeader
          title="Emotional Insights"
          description="Track mood trends, correlations, and emerging patterns."
        />
        <EmptyState
          title="Not enough data yet"
          description="Complete at least 2 check-ins to unlock pattern discovery and trend analysis."
          action={
            <Button asChild>
              <Link href="/check-in">Start Check-In</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { wellnessScore, chartData } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emotional Insights"
        description="Patterns, correlations, and trends from your wellness journey."
      />

      {data.totalCheckIns >= 2 && (
        <Button
          onClick={() => patternMutation.mutate()}
          disabled={patternMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${patternMutation.isPending ? "animate-spin" : ""}`} />
          {patternMutation.isPending ? "Analyzing patterns..." : "Generate AI Pattern Analysis"}
        </Button>
      )}

      {patternInsights?.riskAlerts?.map((alert, i) => (
        <AlertBanner
          key={i}
          message={alert.message}
          severity={alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "info"}
        />
      ))}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TrendCard label="Mood" trend={trends?.moodTrend ?? "stable"} />
        <TrendCard label="Burnout" trend={trends?.burnoutTrend ?? "stable"} />
        <TrendCard label="Anxiety" trend={trends?.anxietyTrend ?? "stable"} />
        <TrendCard label="Confidence" trend={trends?.confidenceTrend ?? "stable"} />
        <TrendCard label="Sleep" trend={trends?.sleepTrend ?? "stable"} />
        <TrendCard label="Study Consistency" trend={trends?.studyConsistencyTrend ?? "stable"} />
      </div>

      {patternInsights && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {patternInsights.weeklySummary}
              </p>
            </CardContent>
          </Card>

          {patternInsights.discoveredPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Discovered Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {patternInsights.discoveredPatterns.map((p, i) => (
                    <li key={i} className="rounded-lg bg-violet-50 px-4 py-3 text-sm dark:bg-violet-950/30">
                      {p}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {patternInsights.correlations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Study-Wellness Correlations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patternInsights.correlations.map((c, i) => (
                  <div key={i} className="border-b border-violet-100 pb-4 last:border-0 dark:border-violet-900">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.relationship}</span>
                      <Badge variant={c.strength === "strong" ? "warning" : "info"}>
                        {c.strength}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mood & Confidence Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodTrendChart data={chartData as never[]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep & Study Correlation</CardTitle>
        </CardHeader>
        <CardContent>
          <SleepStudyChart data={chartData as never[]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wellness Score Components</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm">{wellnessScore.explanation}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(["mood", "sleep", "stress", "confidence", "consistency"] as const).map((key) => (
              <div key={key} className="rounded-lg bg-violet-50 p-3 dark:bg-violet-950/30">
                <p className="text-xs capitalize text-zinc-500">{key}</p>
                <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                  {wellnessScore[key]}/100
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrendCard({ label, trend }: { label: string; trend: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <span className="text-sm text-zinc-500">{label}</span>
        <Badge variant={trendBadge(trend)} className="capitalize">
          {trend}
        </Badge>
      </CardContent>
    </Card>
  );
}
