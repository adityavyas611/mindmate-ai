"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "mindmate-user-id";

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(USER_ID_KEY, id);
    }
    setUserId(id);
  }, []);

  return userId;
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
  submitCheckIn: (userId: string, data: Record<string, unknown>) =>
    apiFetch("/api/check-in", userId, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCheckIns: (userId: string, limit = 30) =>
    apiFetch(`/api/check-in?userId=${userId}&limit=${limit}`, userId),

  getInsights: (userId: string) =>
    apiFetch(`/api/insights?userId=${userId}`, userId),

  generatePatternInsights: (userId: string) =>
    apiFetch("/api/insights", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  generateMindfulness: (userId: string) =>
    apiFetch("/api/mindfulness", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  generateMotivation: (userId: string) =>
    apiFetch("/api/motivation", userId, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  sendChatMessage: (userId: string, message: string) =>
    apiFetch<{ reply: string }>("/api/chat", userId, {
      method: "POST",
      body: JSON.stringify({ userId, message }),
    }),

  getChatHistory: (userId: string) =>
    apiFetch(`/api/chat?userId=${userId}`, userId),

  getProfile: (userId: string) =>
    apiFetch(`/api/profile?userId=${userId}`, userId),

  updateProfile: (userId: string, data: Record<string, unknown>) =>
    apiFetch("/api/profile", userId, {
      method: "PUT",
      body: JSON.stringify({ userId, ...data }),
    }),
};
