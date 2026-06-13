"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  LoadingState,
} from "@/components/shared/page-components";
import { api, useUserId } from "@/hooks/use-user-id";
import { Send, MessageCircle } from "lucide-react";
import { SAFETY_DISCLAIMER } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat", userId],
    queryFn: () => api.getChatHistory(userId!) as Promise<ChatMessage[]>,
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (message: string) => api.sendChatMessage(userId!, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", userId] });
      setInput("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mutation.isPending]);

  if (!userId || isLoading) return <LoadingState message="Loading AI companion..." />;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <PageHeader
        title="AI Companion Chat"
        description="Talk naturally with your wellness coach. It remembers your exam goals and stress patterns."
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b border-violet-100 pb-4 dark:border-violet-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">MindMate Coach</CardTitle>
              <CardDescription className="text-xs">
                Supportive · Empathetic · Not a therapist
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(!messages || messages.length === 0) && (
              <div className="py-8 text-center text-sm text-zinc-500">
                <p>Hi! I&apos;m your MindMate coach.</p>
                <p className="mt-2">
                  Share what&apos;s on your mind — exam stress, motivation, study struggles, or wins.
                </p>
              </div>
            )}

            {messages?.map((msg) => (
              <div
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
                  {msg.content}
                </div>
              </div>
            ))}

            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-violet-50 px-4 py-2.5 text-sm dark:bg-violet-950/50">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce [animation-delay:0.1s]">·</span>
                    <span className="animate-bounce [animation-delay:0.2s]">·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-violet-100 p-4 dark:border-violet-900"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) mutation.mutate(input.trim());
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling about your prep today?"
              disabled={mutation.isPending}
              maxLength={2000}
            />
            <Button type="submit" size="icon" disabled={mutation.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-3 text-xs text-zinc-500">{SAFETY_DISCLAIMER}</p>
    </div>
  );
}
