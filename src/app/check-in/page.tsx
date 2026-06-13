"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, LoadingState } from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { EXAM_TYPES } from "@/lib/utils";
import type { AIAnalysis, MindfulnessExercise, MotivationContent } from "@/schemas";

interface CheckInResponse {
  id: string;
  analysis: AIAnalysis;
  mindfulness: MindfulnessExercise;
  motivation: MotivationContent;
  createdAt: string;
}

export default function CheckInPage() {
  const userId = useUserId();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [journalEntry, setJournalEntry] = useState("");
  const [moodScore, setMoodScore] = useState([6]);
  const [energyLevel, setEnergyLevel] = useState([6]);
  const [sleepHours, setSleepHours] = useState("7");
  const [studyHours, setStudyHours] = useState("6");
  const [examType, setExamType] = useState<string>("JEE");
  const [daysRemaining, setDaysRemaining] = useState("90");
  const [confidenceLevel, setConfidenceLevel] = useState([6]);
  const [anxietyLevel, setAnxietyLevel] = useState([5]);

  const mutation = useMutation({
    mutationFn: () =>
      api.submitCheckIn(userId!, {
        userId,
        journalEntry,
        moodScore: moodScore[0],
        energyLevel: energyLevel[0],
        sleepHours: parseFloat(sleepHours),
        studyHours: parseFloat(studyHours),
        examType,
        daysRemaining: parseInt(daysRemaining, 10),
        confidenceLevel: confidenceLevel[0],
        anxietyLevel: anxietyLevel[0],
      }) as Promise<CheckInResponse>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      sessionStorage.setItem("latest-check-in", "true");
      router.push("/analysis");
    },
  });

  if (!userId) return <LoadingState message="Initializing your session..." />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Daily Check-In"
        description="Share how you're feeling today. Your journal is encrypted and stays private."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Journal Entry</CardTitle>
            <CardDescription>
              Write freely about your day, worries, wins, or anything on your mind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Today I felt... I'm worried about... I'm proud that..."
              required
              maxLength={5000}
              className="min-h-[160px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderField label="Mood" value={moodScore} onChange={setMoodScore} low="Low" high="Great" />
            <SliderField label="Energy Level" value={energyLevel} onChange={setEnergyLevel} />
            <SliderField label="Confidence" value={confidenceLevel} onChange={setConfidenceLevel} />
            <SliderField label="Anxiety" value={anxietyLevel} onChange={setAnxietyLevel} low="Calm" high="High" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study & Sleep</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sleep">Sleep (hours)</Label>
              <Input
                id="sleep"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="study">Study (hours)</Label>
              <Input
                id="study"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exam Context</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((exam) => (
                    <SelectItem key={exam} value={exam}>
                      {exam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="days">Days Until Exam</Label>
              <Input
                id="days"
                type="number"
                min={0}
                max={730}
                value={daysRemaining}
                onChange={(e) => setDaysRemaining(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {mutation.error && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error ? mutation.error.message : "Something went wrong"}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Analyzing with AI..." : "Submit Check-In & Get Insights"}
        </Button>
      </form>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  low = "1",
  high = "10",
}: {
  label: string;
  value: number[];
  onChange: (v: number[]) => void;
  low?: string;
  high?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold text-violet-600">{value[0]}/10</span>
      </div>
      <Slider min={1} max={10} step={1} value={value} onValueChange={onChange} />
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
