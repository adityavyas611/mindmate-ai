"use client";

import { useSyncExternalStore } from "react";
import { v4 as uuidv4 } from "uuid";
import type { CheckInInput, MotivationContent, MindfulnessExercise, PatternInsights, ProfileInput } from "@/schemas";
import type {
  CheckInRecord,
  CheckInSubmitResponse,
  InsightsResponse,
} from "@/types/api";

const USER_ID_KEY = "neurora-user-id";

function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

function subscribe(): () => void {
  return () => {};
}

export function useUserId(): string | null {
  return useSyncExternalStore(subscribe, getUserId, () => null);
}

export function getApiHeaders(userId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-user-id": userId,
  };
}

async function apiFetch<T>(
  url: string,
  userId: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getApiHeaders(userId),
      ...options?.headers,
    },
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: T;
    error?: string;
  };

  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }

  return json.data as T;
}

export const api = {
  submitCheckIn: (userId: string, data: CheckInInput) =>
    apiFetch<CheckInSubmitResponse>("/api/check-in", userId, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCheckIns: (userId: string, limit = 30) =>
    apiFetch<CheckInRecord[]>(`/api/check-in?userId=${userId}&limit=${limit}`, userId),

  getInsights: (userId: string) =>
    apiFetch<InsightsResponse>(`/api/insights?userId=${userId}`, userId),

  generatePatternInsights: (userId: string) =>
    apiFetch<PatternInsights>("/api/insights", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  generateMindfulness: (userId: string) =>
    apiFetch<MindfulnessExercise>("/api/mindfulness", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  generateMotivation: (userId: string) =>
    apiFetch<MotivationContent>("/api/motivation", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  sendChatMessage: (userId: string, message: string) =>
    apiFetch<{ reply: string }>("/api/chat", userId, {
      method: "POST",
      body: JSON.stringify({ userId, message }),
    }),

  getChatHistory: (userId: string) =>
    apiFetch<Array<{ id: string; role: "user" | "assistant"; content: string; createdAt: string }>>(
      `/api/chat?userId=${userId}`,
      userId
    ),

  getProfile: (userId: string) =>
    apiFetch(`/api/profile?userId=${userId}`, userId),

  updateProfile: (userId: string, data: Omit<ProfileInput, "userId">) =>
    apiFetch("/api/profile", userId, {
      method: "PUT",
      body: JSON.stringify({ userId, ...data }),
    }),
};
