"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  StatCard,
} from "@/components/shared/page-components";
import { WellnessScoreChart } from "@/components/charts/trend-charts";
import { api, useUserId } from "@/hooks/use-user-id";
import { Activity, Brain, Heart, Moon, Target } from "lucide-react";
import type { WellnessScoreBreakdown } from "@/lib/wellness";

interface DashboardData {
  wellnessScore: WellnessScoreBreakdown;
  burnoutLevel: string;
  chartData: Array<Record<string, unknown>>;
  totalCheckIns: number;
  latestAnalysis?: {
    stressPredictorScore?: number;
    earlyWarning?: { triggered: boolean; message: string };
  };
}

function burnoutVariant(level: string): "success" | "warning" | "danger" {
  if (level === "low") return "success";
  if (level === "moderate") return "warning";
  return "danger";
}

export default function DashboardPage() {
  const userId = useUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => api.getInsights(userId!) as Promise<DashboardData>,
    enabled: !!userId,
  });

  if (!userId || isLoading) return <LoadingState message="Loading wellness dashboard..." />;

  if (!data || data.totalCheckIns === 0) {
    return (
      <div>
        <PageHeader
          title="Wellness Dashboard"
          description="Your holistic wellness overview at a glance."
        />
        <EmptyState
          title="Welcome to MindMate AI"
          description="Complete your first check-in to see your wellness score, trends, and personalized insights."
          action={
            <Button asChild>
              <Link href="/check-in">Start Check-In</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { wellnessScore, burnoutLevel, chartData, latestAnalysis } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wellness Dashboard"
        description="Your holistic wellness overview at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Wellness Score"
          value={`${wellnessScore.overall}/100`}
          subtitle="Composite wellness index"
          icon={Heart}
        />
        <StatCard
          title="Burnout Risk"
          value={burnoutLevel}
          subtitle="Based on recent patterns"
          icon={Activity}
        />
        <StatCard
          title="Stress Predictor"
          value={`${latestAnalysis?.stressPredictorScore ?? "—"}/100`}
          subtitle="Exam stress forecast"
          icon={Brain}
        />
        <StatCard
          title="Check-Ins"
          value={data.totalCheckIns}
          subtitle="Total entries logged"
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Wellness Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["Mood", wellnessScore.mood],
                ["Sleep", wellnessScore.sleep],
                ["Stress Management", wellnessScore.stress],
                ["Confidence", wellnessScore.confidence],
                ["Consistency", wellnessScore.consistency],
              ] as const
            ).map(([label, score]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{score}/100</span>
                </div>
                <Progress value={score} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wellness & Stress Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <WellnessScoreChart data={chartData as never[]} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-violet-600" />
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {wellnessScore.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-violet-600">→</span>
                {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Badge variant={burnoutVariant(burnoutLevel)} className="capitalize px-3 py-1">
          Burnout: {burnoutLevel}
        </Badge>
        {latestAnalysis?.earlyWarning?.triggered && (
          <Badge variant="danger" className="px-3 py-1">
            Early Warning Active
          </Badge>
        )}
      </div>
    </div>
  );
}
