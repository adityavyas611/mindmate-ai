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
} from "@/components/shared/page-components";
import { MoodTrendChart } from "@/components/charts/trend-charts";
import { api, useUserId } from "@/hooks/use-user-id";
import { formatDate } from "@/lib/utils";

interface CheckInRecord {
  id: string;
  journalEntry: string;
  moodScore: number;
  energyLevel: number;
  sleepHours: number;
  studyHours: number;
  confidenceLevel: number;
  anxietyLevel: number;
  examType: string;
  createdAt: string;
}

export default function MoodHistoryPage() {
  const userId = useUserId();

  const { data, isLoading } = useQuery({
    queryKey: ["check-ins", userId],
    queryFn: () => api.getCheckIns(userId!) as Promise<CheckInRecord[]>,
    enabled: !!userId,
  });

  if (!userId || isLoading) return <LoadingState message="Loading mood history..." />;

  if (!data?.length) {
    return (
      <div>
        <PageHeader title="Mood History" description="Your emotional journey over time." />
        <EmptyState
          title="No history yet"
          description="Your check-in history will appear here as you build your wellness journal."
          action={
            <Button asChild>
              <Link href="/check-in">Start Check-In</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const chartData = [...data]
    .reverse()
    .map((c) => ({
      date: formatDate(c.createdAt),
      mood: c.moodScore,
      anxiety: c.anxietyLevel,
      confidence: c.confidenceLevel,
      energy: c.energyLevel,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mood History"
        description={`${data.length} check-in${data.length !== 1 ? "s" : ""} recorded`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Trend Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodTrendChart data={chartData} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{formatDate(entry.createdAt)}</CardTitle>
                <Badge variant="info">{entry.examType}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap gap-2">
                <MetricPill label="Mood" value={entry.moodScore} />
                <MetricPill label="Energy" value={entry.energyLevel} />
                <MetricPill label="Confidence" value={entry.confidenceLevel} />
                <MetricPill label="Anxiety" value={entry.anxietyLevel} />
                <MetricPill label="Sleep" value={`${entry.sleepHours}h`} />
                <MetricPill label="Study" value={`${entry.studyHours}h`} />
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {entry.journalEntry}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
      {label}: {value}
    </span>
  );
}
