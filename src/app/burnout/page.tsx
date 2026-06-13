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
  AlertBanner,
} from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { ESCALATION_MESSAGE } from "@/lib/utils";
import { severityBadgeVariant } from "@/types/api";
import { AlertTriangle, Shield, Activity } from "lucide-react";

function riskScore(level: string): number {
  const map: Record<string, number> = {
    low: 20,
    moderate: 50,
    high: 75,
    critical: 95,
  };
  return map[level] ?? 30;
}

export default function BurnoutPage() {
  const userId = useUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => api.getInsights(userId!),
    enabled: !!userId,
  });

  if (!userId || isLoading) return <LoadingState message="Monitoring burnout risk..." />;

  if (!data || data.totalCheckIns === 0) {
    return (
      <div>
        <PageHeader
          title="Burnout Risk Monitor"
          description="Early detection and prevention of exam burnout."
        />
        <EmptyState
          title="Start tracking"
          description="Complete check-ins to monitor burnout risk and receive early warnings."
          action={
            <Button asChild>
              <Link href="/check-in">Start Check-In</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { burnoutLevel, wellnessScore, latestAnalysis } = data;
  const score = riskScore(burnoutLevel);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Burnout Risk Monitor"
        description="Early detection and prevention of exam burnout."
      />

      {latestAnalysis?.earlyWarning?.triggered && (
        <AlertBanner
          message={
            latestAnalysis.earlyWarning.severity === "severe"
              ? ESCALATION_MESSAGE
              : latestAnalysis.earlyWarning.message
          }
          severity={
            latestAnalysis.earlyWarning.severity === "severe" ? "critical" : "warning"
          }
        />
      )}

      <Card className="border-violet-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900">
              <AlertTriangle className="h-6 w-6 text-violet-600" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Current Burnout Risk</CardTitle>
              <Badge variant={severityBadgeVariant(burnoutLevel)} className="mt-1 capitalize">
                {burnoutLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score} className="h-4" aria-label={`Burnout risk level ${burnoutLevel}`} />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Based on your recent anxiety levels, energy, sleep, and study patterns over the last 7 check-ins.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <RiskFactorCard
          icon={Activity}
          label="Stress Level"
          value={latestAnalysis?.stressLevel ?? "—"}
        />
        <RiskFactorCard
          icon={Shield}
          label="AI Burnout Assessment"
          value={latestAnalysis?.burnoutRisk ?? "—"}
        />
        <RiskFactorCard
          icon={AlertTriangle}
          label="Wellness Score"
          value={`${wellnessScore.overall}/100`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protective Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FactorBar label="Stress Management" value={wellnessScore.stress} />
          <FactorBar label="Sleep Quality" value={wellnessScore.sleep} />
          <FactorBar label="Study Consistency" value={wellnessScore.consistency} />
        </CardContent>
      </Card>

      {latestAnalysis?.copingStrategies && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Recovery Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {latestAnalysis.copingStrategies.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-violet-600" aria-hidden="true">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/mindfulness">Try Mindfulness</Link>
        </Button>
        <Button asChild>
          <Link href="/check-in">Log How You Feel</Link>
        </Button>
      </div>
    </div>
  );
}

function RiskFactorCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="mb-2 h-5 w-5 text-violet-600" aria-hidden="true" />
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-1 font-semibold capitalize">{value}</p>
      </CardContent>
    </Card>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <Progress value={value} aria-label={`${label} ${value} out of 100`} />
    </div>
  );
}
