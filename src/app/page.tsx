"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api, useUserId } from "@/hooks/use-user-id";
import { LoadingState, QueryErrorState } from "@/components/shared/page-components";
import {
  PenLine,
  Brain,
  TrendingUp,
  Wind,
  MessageCircle,
  ArrowRight,
  Heart,
} from "lucide-react";

export default function HomePage() {
  const userId = useUserId();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => api.getInsights(userId!) as Promise<{
      wellnessScore: { overall: number };
      totalCheckIns: number;
      burnoutLevel: string;
    }>,
    enabled: !!userId,
  });

  const features = [
    {
      href: "/check-in",
      icon: PenLine,
      title: "Daily Check-In",
      description: "Log mood, energy, sleep, and journal thoughts",
    },
    {
      href: "/analysis",
      icon: Brain,
      title: "AI Analysis",
      description: "Get personalized emotional insights",
    },
    {
      href: "/insights",
      icon: TrendingUp,
      title: "Pattern Discovery",
      description: "Discover stress triggers and correlations",
    },
    {
      href: "/mindfulness",
      icon: Wind,
      title: "Mindfulness Coach",
      description: "Adaptive breathing and grounding exercises",
    },
    {
      href: "/chat",
      icon: MessageCircle,
      title: "AI Companion",
      description: "Chat with your empathetic wellness coach",
    },
  ];

  return (
    <div className="space-y-8">
      <section
        className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-white lg:p-12"
        aria-labelledby="home-hero-heading"
      >
        <div className="flex items-center gap-2 text-violet-200">
          <Heart className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Exam Wellness Companion</span>
        </div>
        <h1 id="home-hero-heading" className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
          Survive exam prep without losing yourself
        </h1>
        <p className="mt-4 max-w-2xl text-violet-100 leading-relaxed">
          Neurora helps JEE, NEET, UPSC, CAT, GATE, CUET, and Board Exam students
          monitor emotional well-being, detect stress patterns, prevent burnout, and build
          healthy study habits — with an empathetic AI coach by your side.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="secondary">
            <Link href="/check-in">
              Start Today&apos;s Check-In
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </section>

      {userId && isLoading && (
        <LoadingState message="Loading your wellness snapshot..." />
      )}

      {userId && isError && (
        <QueryErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {data && data.totalCheckIns > 0 && (
        <Card aria-label="Your wellness snapshot">
          <CardHeader>
            <CardTitle>Your Wellness Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-500">Wellness Score</p>
                <p
                  className="text-3xl font-bold text-violet-700 dark:text-violet-300"
                  aria-label={`Wellness score ${data.wellnessScore.overall} out of 100`}
                >
                  {data.wellnessScore.overall}/100
                </p>
                <Progress
                  value={data.wellnessScore.overall}
                  className="mt-2"
                  aria-label="Wellness score progress"
                />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Check-Ins</p>
                <p className="text-3xl font-bold">{data.totalCheckIns}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Burnout Risk</p>
                <p className="text-3xl font-bold capitalize">{data.burnoutLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-label="Feature quick links" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} aria-label={`${title}: ${description}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <Icon className="h-6 w-6 text-violet-600" aria-hidden="true" />
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-500">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-zinc-500">
          Built for students preparing for high-stakes exams. Your journal is encrypted.
          No data is shared. Neurora is not a therapist — always seek professional help when needed.
        </CardContent>
      </Card>
    </div>
  );
}
