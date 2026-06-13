"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  LoadingState,
  AlertBanner,
  QueryErrorState,
} from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { Send, MessageCircle } from "lucide-react";
import { ESCALATION_MESSAGE, SAFETY_DISCLAIMER, shouldShowEscalation } from "@/lib/utils";
import { chatMessageSchema } from "@/schemas";

export default function ChatPage() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["chat", userId],
    queryFn: () => api.getChatHistory(userId!),
    enabled: !!userId,
  });

  const { data: insights } = useQuery({
    queryKey: ["insights", userId],
    queryFn: () => api.getInsights(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (message: string) => api.sendChatMessage(userId!, message),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat", userId] });
      setInput("");
      setValidationError(null);
      setLiveAnnouncement(`Coach replied: ${data.reply}`);
    },
  });

  useEffect(() => {
    if (mutation.isPending) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [mutation.isPending]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId) return;

      const parsed = chatMessageSchema.safeParse({
        userId,
        message: input.trim(),
      });

      if (!parsed.success) {
        setValidationError(parsed.error.errors[0]?.message ?? "Invalid message");
        return;
      }

      setValidationError(null);
      mutation.mutate(parsed.data.message);
    },
    [userId, input, mutation]
  );

  if (!userId || isLoading) return <LoadingState message="Loading AI companion..." />;

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="AI Companion Chat"
          description="Talk naturally with your wellness coach."
        />
        <QueryErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const displayError =
    validationError ??
    (mutation.error instanceof Error ? mutation.error.message : null);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader
        title="AI Companion Chat"
        description="Talk naturally with your wellness coach. It remembers your exam goals and stress patterns."
      />

      {shouldShowEscalation(insights?.latestAnalysis) && (
        <AlertBanner message={ESCALATION_MESSAGE} severity="critical" />
      )}

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b border-violet-100 pb-4 dark:border-violet-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">Neurora Coach</CardTitle>
              <CardDescription className="text-xs">
                Supportive · Empathetic · Not a therapist
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div
            className="flex-1 overflow-y-auto p-4"
            role="region"
            aria-label="Chat messages"
          >
            {(!messages || messages.length === 0) && (
              <div className="py-8 text-center text-sm text-zinc-500" role="status">
                <p>Hi! I&apos;m your Neurora coach.</p>
                <p className="mt-2">
                  Share what&apos;s on your mind — exam stress, motivation, study struggles, or wins.
                </p>
              </div>
            )}

            <ul className="space-y-4">
              {messages?.map((msg) => (
                <li
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white"
                        : "bg-violet-50 text-zinc-800 dark:bg-violet-950/50 dark:text-zinc-200"
                    }`}
                  >
                    <span className="sr-only">
                      {msg.role === "user" ? "You said: " : "Coach said: "}
                    </span>
                    {msg.content}
                  </div>
                </li>
              ))}
            </ul>

            {mutation.isPending && (
              <div className="mt-4 flex justify-start" role="status" aria-live="polite">
                <div className="rounded-2xl bg-violet-50 px-4 py-2.5 text-sm dark:bg-violet-950/50">
                  <span className="inline-flex gap-1 motion-reduce:opacity-70">
                    <span className="animate-bounce motion-reduce:animate-none">·</span>
                    <span className="animate-bounce motion-reduce:animate-none [animation-delay:0.1s]">·</span>
                    <span className="animate-bounce motion-reduce:animate-none [animation-delay:0.2s]">·</span>
                  </span>
                  <span className="sr-only">Coach is typing</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-violet-100 p-4 dark:border-violet-900"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={mutation.isPending}
          >
            <Label htmlFor="chat-input" className="sr-only">
              Message to AI coach
            </Label>
            <Input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling about your prep today?"
              disabled={mutation.isPending}
              maxLength={2000}
              aria-describedby={displayError ? "chat-error" : undefined}
              aria-invalid={displayError ? true : undefined}
            />
            <Button
              type="submit"
              size="icon"
              disabled={mutation.isPending || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
          {displayError && (
            <p id="chat-error" className="px-4 pb-4 text-sm text-red-600" role="alert">
              {displayError}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-zinc-500">{SAFETY_DISCLAIMER}</p>
    </div>
  );
}
