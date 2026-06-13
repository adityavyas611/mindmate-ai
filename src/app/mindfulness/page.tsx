"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  LoadingState,
  EmptyState,
} from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { Wind, RefreshCw } from "lucide-react";
import type { MindfulnessExercise } from "@/schemas";

const typeLabels: Record<string, string> = {
  reset: "1-Minute Reset",
  breathing: "Deep Breathing",
  grounding: "Grounding",
  visualization: "Visualization",
  exam_anxiety: "Exam Anxiety Relief",
  sleep_prep: "Sleep Preparation",
};

export default function MindfulnessPage() {
  const userId = useUserId();

  const mutation = useMutation({
    mutationFn: () => api.generateMindfulness(userId!) as Promise<MindfulnessExercise>,
  });

  if (!userId) return <LoadingState message="Loading mindfulness coach..." />;

  const exercise = mutation.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Mindfulness Coach"
        description="AI-personalized exercises adapted to your mood, stress, and exam timeline."
      />

      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Generate Exercise</CardTitle>
              <CardDescription>
                Based on your latest check-in — mood, stress, and time available.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? (
              "Creating your exercise..."
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Get Personalized Exercise
              </>
            )}
          </Button>
          {mutation.error && (
            <p className="mt-3 text-sm text-red-600">
              {mutation.error instanceof Error &&
              mutation.error.message.includes("check-in")
                ? "Complete a check-in first to unlock personalized exercises."
                : mutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      {!exercise && !mutation.isPending && !mutation.error && (
        <EmptyState
          title="Ready when you are"
          description="Tap the button above to receive a mindfulness exercise tailored to how you're feeling right now."
          action={
            <Button variant="outline" asChild>
              <Link href="/check-in">Do a Check-In First</Link>
            </Button>
          }
        />
      )}

      {exercise && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{exercise.title}</CardTitle>
              <Badge variant="info">{typeLabels[exercise.type] ?? exercise.type}</Badge>
              <Badge variant="default">{exercise.durationMinutes} min</Badge>
            </div>
            <CardDescription>{exercise.adaptationReason}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
