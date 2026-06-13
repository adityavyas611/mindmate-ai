import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.errors.map((e) => e.message).join(", "), 422);
  }
  console.error("[API Error]", error);
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return jsonError(message, 500);
}

export function validateUserIdHeader(request: Request): string | null {
  return request.headers.get("x-user-id");
}
