import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

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
  if (error instanceof SyntaxError) {
    return jsonError("Invalid JSON body", 422);
  }
  console.error("[API Error]", error);
  return jsonError("An unexpected error occurred. Please try again later.", 500);
}

export async function parseJsonBody(request: Request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: jsonError("Invalid JSON body", 422) };
  }
}

export function validateUserIdHeader(request: Request): string | null {
  return request.headers.get("x-user-id");
}

const userIdParamSchema = z.string().uuid();
const limitParamSchema = z.coerce.number().int().min(1).max(100).default(30);

export function parseUserIdParam(userId: string | null) {
  if (!userId) {
    return { error: jsonError("userId is required") };
  }
  const parsed = userIdParamSchema.safeParse(userId);
  if (!parsed.success) {
    return { error: jsonError("Invalid userId format") };
  }
  return { userId: parsed.data };
}

export function validateUserIdAccess(
  headerUserId: string | null,
  userId: string
) {
  if (!headerUserId) {
    return jsonError("Authentication required", 401);
  }
  if (headerUserId !== userId) {
    return jsonError("User ID mismatch", 403);
  }
  return null;
}

export function applyRateLimit(
  request: Request,
  routeKey: string,
  limit = 10,
  windowMs = 60_000
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const result = checkRateLimit(`${routeKey}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    return jsonError(
      `Too many requests. Try again in ${result.retryAfterSeconds}s.`,
      429
    );
  }
  return null;
}

export function parseLimitParam(limit: string | null) {
  const parsed = limitParamSchema.safeParse(limit ?? undefined);
  if (!parsed.success) {
    return { error: jsonError("Invalid limit parameter") };
  }
  return { limit: parsed.data };
}
