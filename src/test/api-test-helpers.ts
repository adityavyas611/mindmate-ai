import { NextRequest } from "next/server";

export const VALID_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
export const OTHER_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

export function makeJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export function makeGetRequest(
  url: string,
  headers: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
  });
}
