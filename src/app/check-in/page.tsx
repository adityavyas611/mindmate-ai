"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { SliderField } from "@/components/forms/slider-field";
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
import {
  validateCheckInForm,
  formatCheckInValidationErrors,
} from "@/lib/validation/check-in-form";
import type { CheckInInput } from "@/schemas";

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
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: CheckInInput) => api.submitCheckIn(input.userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      sessionStorage.setItem("latest-check-in", "true");
      router.push("/analysis");
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) return;

      const result = validateCheckInForm({
        userId,
        journalEntry: journalEntry.trim(),
        moodScore: moodScore[0],
        energyLevel: energyLevel[0],
        sleepHours: parseFloat(sleepHours),
        studyHours: parseFloat(studyHours),
        examType,
        daysRemaining: parseInt(daysRemaining, 10),
        confidenceLevel: confidenceLevel[0],
        anxietyLevel: anxietyLevel[0],
      });

      if (!result.success) {
        setValidationError(formatCheckInValidationErrors(result));
        return;
      }

      setValidationError(null);
      mutation.mutate(result.data);
    },
    [
      userId,
      journalEntry,
      moodScore,
      energyLevel,
      sleepHours,
      studyHours,
      examType,
      daysRemaining,
      confidenceLevel,
      anxietyLevel,
      mutation,
    ]
  );

  const displayError =
    validationError ??
    (mutation.error instanceof Error ? mutation.error.message : null);

  if (!userId) return <LoadingState message="Initializing your session..." />;

  const errorId = "check-in-error";
  const fieldErrorProps = displayError
    ? ({ "aria-describedby": errorId, "aria-invalid": true as const })
    : {};
  const sliderErrorProps = displayError
    ? { invalid: true as const, errorId }
    : {};

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Daily Check-In"
        description="Share how you're feeling today. Your journal is encrypted and stays private."
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        aria-busy={mutation.isPending}
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Journal Entry</CardTitle>
            <CardDescription>
              Write freely about your day, worries, wins, or anything on your mind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="journal-entry" className="sr-only">
              Journal entry
            </Label>
            <Textarea
              id="journal-entry"
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder="Today I felt... I'm worried about... I'm proud that..."
              required
              maxLength={5000}
              className="min-h-[160px]"
              {...fieldErrorProps}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderField id="mood" label="Mood" value={moodScore} onChange={setMoodScore} low="Low" high="Great" {...sliderErrorProps} />
            <SliderField id="energy" label="Energy Level" value={energyLevel} onChange={setEnergyLevel} {...sliderErrorProps} />
            <SliderField id="confidence" label="Confidence" value={confidenceLevel} onChange={setConfidenceLevel} {...sliderErrorProps} />
            <SliderField id="anxiety" label="Anxiety" value={anxietyLevel} onChange={setAnxietyLevel} low="Calm" high="High" {...sliderErrorProps} />
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
                {...fieldErrorProps}
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
                {...fieldErrorProps}
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
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger id="exam-type" aria-label="Exam type" {...fieldErrorProps}>
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
                {...fieldErrorProps}
              />
            </div>
          </CardContent>
        </Card>

        {displayError && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {displayError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Analyzing with AI..." : "Submit Check-In & Get Insights"}
        </Button>
      </form>
    </div>
  );
}
