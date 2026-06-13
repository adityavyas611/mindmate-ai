import { describe, it, expect, beforeEach } from "vitest";
import { ZodError } from "zod";
import {
  jsonError,
  handleApiError,
  parseUserIdParam,
  validateUserIdAccess,
} from "@/lib/api-utils";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

describe("handleApiError", () => {
  it("returns 422 for Zod errors", async () => {
    const error = new ZodError([
      { code: "custom", path: ["field"], message: "Invalid field" },
    ]);
    const response = handleApiError(error);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Invalid field");
  });

  it("returns generic 500 message for unknown errors", async () => {
    const response = handleApiError(new Error("OPENAI_API_KEY is not configured"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("An unexpected error occurred. Please try again later.");
    expect(body.error).not.toContain("OPENAI");
  });
});

describe("parseUserIdParam", () => {
  it("returns error when userId is missing", () => {
    const result = parseUserIdParam(null);
    expect(result.error).toBeDefined();
  });

  it("returns error for invalid UUID", () => {
    const result = parseUserIdParam("not-a-uuid");
    expect(result.error).toBeDefined();
  });

  it("returns userId for valid UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const result = parseUserIdParam(uuid);
    expect(result.userId).toBe(uuid);
  });
});

describe("validateUserIdAccess", () => {
  it("returns null when header matches", () => {
    expect(
      validateUserIdAccess("550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440000")
    ).toBeNull();
  });

  it("returns 403 when header mismatches", async () => {
    const response = validateUserIdAccess("aaa", "bbb");
    expect(response?.status).toBe(403);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests under limit", () => {
    expect(checkRateLimit("test-key", 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit("test-key", 3, 60_000).allowed).toBe(true);
  });

  it("blocks requests over limit", () => {
    checkRateLimit("block-key", 2, 60_000);
    checkRateLimit("block-key", 2, 60_000);
    const result = checkRateLimit("block-key", 2, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("jsonError", () => {
  it("returns error payload with status", async () => {
    const response = jsonError("Bad request", 400);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: "Bad request" });
  });
});
