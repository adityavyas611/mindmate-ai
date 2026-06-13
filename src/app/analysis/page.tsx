"use client";

import { useQuery } from "@tanstack/react-query";
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
import { api, useUserId } from "@/hooks/use-user-id";
import { ESCALATION_MESSAGE, formatDate } from "@/lib/utils";
import { scoreBadgeVariant, severityBadgeVariant } from "@/types/api";

export default function AnalysisPage() {
  const userId = useUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["check-ins", userId],
    queryFn: () => api.getCheckIns(userId!),
    enabled: !!userId,
  });

  if (!userId || isLoading) return <LoadingState message="Loading your analysis..." />;

  const latest = data?.[0];

  if (!latest?.analysis) {
    return (
      <div>
        <PageHeader
          title="AI Journal Analysis"
          description="Personalized insights from your emotional check-ins."
        />
        <EmptyState
          title="No analysis yet"
          description="Complete your first daily check-in to receive AI-powered emotional insights."
          action={
            <Button asChild>
              <Link href="/check-in">Start Check-In</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const analysis = latest.analysis;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="AI Journal Analysis"
        description={`Analysis for ${formatDate(latest.createdAt)}`}
      />

      {analysis.earlyWarning?.triggered && (
        <AlertBanner
          message={
            analysis.earlyWarning.severity === "severe"
              ? ESCALATION_MESSAGE
              : analysis.earlyWarning.message
          }
          severity={
            analysis.earlyWarning.severity === "severe"
              ? "critical"
              : analysis.earlyWarning.severity === "moderate"
                ? "warning"
                : "info"
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Analysis metrics">
        <MetricCard label="Stress" value={analysis.stressLevel} />
        <MetricCard label="Burnout Risk" value={analysis.burnoutRisk} />
        <MetricCard label="Motivation" value={analysis.motivationLevel} />
        <MetricCard label="Wellness Score" value={`${analysis.wellnessScore}/100`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emotional State</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
            {analysis.emotionalState}
          </p>
        </CardContent>
      </Card>

      <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/30">
        <CardHeader>
          <CardTitle>Your Coach Says</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-violet-900 dark:text-violet-100">
            {analysis.encouragement}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightList title="Personalized Insights" items={analysis.personalizedInsights} />
        <InsightList title="Coping Strategies" items={analysis.copingStrategies} />
        <InsightList title="Recurring Themes" items={analysis.recurringThemes} />
        <InsightList title="Hidden Stress Triggers" items={analysis.hiddenStressTriggers} />
        <InsightList title="Negative Self-Talk Patterns" items={analysis.negativeSelfTalkPatterns} />
        <InsightList title="Academic Pressure Indicators" items={analysis.academicPressureIndicators} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stress Predictor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={analysis.stressPredictorScore > 70 ? "danger" : analysis.stressPredictorScore > 40 ? "warning" : "success"}>
              {analysis.stressPredictorScore}/100
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {analysis.stressPredictorExplanation}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wellness Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm leading-relaxed">{analysis.wellnessScoreExplanation}</p>
          <InsightList title="Improvement Suggestions" items={analysis.improvementSuggestions} />
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-500" role="note">
        {analysis.safetyNote}
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  const variant = value.includes("/100")
    ? scoreBadgeVariant(value)
    : severityBadgeVariant(value);

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-zinc-500">{label}</p>
        <Badge variant={variant} className="mt-2 capitalize">
          {value}
        </Badge>
      </CardContent>
    </Card>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
