"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageHeader,
  LoadingState,
} from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { Sparkles, RefreshCw } from "lucide-react";
import type { MotivationContent } from "@/schemas";

export default function MotivationPage() {
  const userId = useUserId();

  const mutation = useMutation({
    mutationFn: () => api.generateMotivation(userId!) as Promise<MotivationContent>,
  });

  if (!userId) return <LoadingState message="Loading motivation center..." />;

  const content = mutation.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Motivation Center"
        description="Personalized affirmations, encouragement, and progress celebrations."
      />

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        size="lg"
        className="w-full"
        aria-busy={mutation.isPending}
      >
        {mutation.isPending ? (
          "Generating motivation..."
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refresh Motivation
          </>
        )}
      </Button>

      {mutation.isPending && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-sm dark:border-violet-900 dark:bg-violet-950/30" role="status" aria-live="polite">
          Generating personalized motivation for you...
        </div>
      )}

      {mutation.error && (
        <p className="text-sm text-red-600" role="alert">
          {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
        </p>
      )}

      {content && (
        <div className="space-y-4" role="status" aria-live="polite">
          <MotivationCard
            icon={<Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />}
            title="Today's Affirmation"
            content={content.affirmation}
            highlight
          />
          <MotivationCard
            title="Daily Encouragement"
            content={content.dailyEncouragement}
          />
          {content.progressCelebration && (
            <MotivationCard
              title="Progress Celebration"
              content={content.progressCelebration}
            />
          )}
          {content.milestoneRecognition && (
            <MotivationCard
              title="Milestone Recognition"
              content={content.milestoneRecognition}
            />
          )}
        </div>
      )}

      {!content && !mutation.isPending && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center" role="status" aria-live="polite">
            <Sparkles className="mx-auto h-10 w-10 text-violet-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-medium text-violet-900 dark:text-violet-100">
              Your motivation awaits
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Tap refresh to receive personalized motivation based on your journey.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MotivationCard({
  title,
  content,
  icon,
  highlight,
}: {
  title: string;
  content: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{content}</p>
      </CardContent>
    </Card>
  );
}
