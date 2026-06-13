"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, LoadingState, QueryErrorState } from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { EXAM_TYPES } from "@/lib/utils";
import {
  buildProfilePayload,
  formatProfileValidationErrors,
} from "@/lib/validation/profile-form";
import type { ProfileInput } from "@/schemas";

type ProfileData = Omit<ProfileInput, "userId"> & {
  knownStressTriggers?: string[];
  userId: string;
};

export function ProfileForm({ userId, initialData }: { userId: string; initialData: ProfileData }) {
  const queryClient = useQueryClient();

  const [examType, setExamType] = useState<string>(initialData.examType ?? "JEE");
  const [examGoal, setExamGoal] = useState(initialData.examGoal ?? "");
  const [motivationalPreferences, setMotivationalPreferences] = useState(
    initialData.motivationalPreferences ?? ""
  );
  const [stressTriggersText, setStressTriggersText] = useState(
    initialData.knownStressTriggers?.join(", ") ?? ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Omit<ProfileInput, "userId">) =>
      api.updateProfile(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setValidationError(null);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const result = buildProfilePayload(userId, {
        examType: examType as ProfileInput["examType"],
        examGoal,
        motivationalPreferences,
        stressTriggersText,
      });

      if (!result.success) {
        setValidationError(formatProfileValidationErrors(result));
        return;
      }

      setValidationError(null);
      mutation.mutate({
        examType: result.data.examType,
        examGoal: result.data.examGoal,
        motivationalPreferences: result.data.motivationalPreferences,
        knownStressTriggers: result.data.knownStressTriggers,
      });
    },
    [userId, examType, examGoal, motivationalPreferences, stressTriggersText, mutation]
  );

  const displayError =
    validationError ??
    (mutation.error instanceof Error ? mutation.error.message : null);

  const errorId = "profile-error";
  const fieldErrorProps = displayError
    ? ({ "aria-describedby": errorId, "aria-invalid": true as const })
    : {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={mutation.isPending} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>
            Helps tailor insights and recommendations to your preparation journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profile-exam-type">Exam Type</Label>
            <Select value={examType} onValueChange={setExamType}>
              <SelectTrigger id="profile-exam-type" aria-label="Exam type" {...fieldErrorProps}>
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
            <Label htmlFor="exam-goal">Exam Goal</Label>
            <Input
              id="exam-goal"
              value={examGoal}
              onChange={(e) => setExamGoal(e.target.value)}
              placeholder="e.g. Top 500 rank in JEE Advanced"
              maxLength={500}
              {...fieldErrorProps}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motivation Preferences</CardTitle>
          <CardDescription>
            Tell us what kind of encouragement works best for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="motivation-prefs" className="sr-only">
            Motivation preferences
          </Label>
          <Textarea
            id="motivation-prefs"
            value={motivationalPreferences}
            onChange={(e) => setMotivationalPreferences(e.target.value)}
            placeholder="e.g. Short affirmations, focus on progress over perfection..."
              maxLength={500}
              className="min-h-[100px]"
              {...fieldErrorProps}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Known Stress Triggers</CardTitle>
          <CardDescription>
            Comma-separated list of situations that tend to increase your stress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="stress-triggers" className="sr-only">
            Known stress triggers
          </Label>
          <Textarea
            id="stress-triggers"
            value={stressTriggersText}
            onChange={(e) => setStressTriggersText(e.target.value)}
              placeholder="e.g. Mock test results, comparing with peers, last-minute syllabus..."
              className="min-h-[100px]"
              {...fieldErrorProps}
            />
        </CardContent>
      </Card>

      {displayError && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {displayError}
        </p>
      )}

      {mutation.isSuccess && !displayError && (
        <p className="text-sm text-green-600" role="status" aria-live="polite">
          Profile saved successfully.
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const userId = useUserId();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => api.getProfile(userId!) as Promise<ProfileData>,
    enabled: !!userId,
  });

  if (!userId || isLoading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Profile & Settings"
          description="Personalize Neurora with your exam goals, motivation style, and known stress triggers."
        />
        <QueryErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return <LoadingState message="Loading your profile..." />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Profile & Settings"
        description="Personalize Neurora with your exam goals, motivation style, and known stress triggers."
      />
      <ProfileForm key={data.userId} userId={userId} initialData={data} />
    </div>
  );
}
