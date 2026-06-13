import { describe, it, expect, beforeEach } from "vitest";
import { ZodError } from "zod";
import {
  jsonError,
  handleApiError,
  parseUserIdParam,
  validateUserIdAccess,
  parseLimitParam,
  applyRateLimit,
  parseJsonBody,
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

  it("returns generic 500 message for unknown errors in production", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const response = handleApiError(new Error("OPENAI_API_KEY is not configured"));
    process.env.NODE_ENV = prev;
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("An unexpected error occurred. Please try again later.");
    expect(body.error).not.toContain("OPENAI");
  });

  it("returns setup hints for known config errors in development", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const response = handleApiError(
      new Error("querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net")
    );
    process.env.NODE_ENV = prev;
    const body = await response.json();
    expect(body.error).toContain("MONGODB_URI");
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

describe("parseLimitParam", () => {
  it("defaults to 30 when limit is omitted", () => {
    const result = parseLimitParam(null);
    expect(result.limit).toBe(30);
  });

  it("parses valid limit string", () => {
    const result = parseLimitParam("50");
    expect(result.limit).toBe(50);
  });

  it("returns error for invalid limit", async () => {
    const result = parseLimitParam("abc");
    expect(result.error).toBeDefined();
    const response = result.error!;
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid limit parameter");
  });

  it("returns error for limit over 100", () => {
    const result = parseLimitParam("200");
    expect(result.error).toBeDefined();
  });
});

describe("validateUserIdAccess", () => {
  it("returns null when header matches", () => {
    expect(
      validateUserIdAccess("550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440000")
    ).toBeNull();
  });

  it("returns 401 when header is missing", async () => {
    const response = validateUserIdAccess(null, "550e8400-e29b-41d4-a716-446655440000");
    expect(response?.status).toBe(401);
    const body = await response!.json();
    expect(body.error).toBe("Authentication required");
  });

  it("returns 403 when header mismatches", async () => {
    const response = validateUserIdAccess("aaa", "bbb");
    expect(response?.status).toBe(403);
  });
});

describe("applyRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("returns null when under limit", () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(applyRateLimit(request, "test-route", 2, 60_000)).toBeNull();
  });

  it("returns 429 when over limit", async () => {
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    applyRateLimit(request, "test-route-429", 2, 60_000);
    applyRateLimit(request, "test-route-429", 2, 60_000);
    const blocked = applyRateLimit(request, "test-route-429", 2, 60_000);
    expect(blocked?.status).toBe(429);
    const body = await blocked!.json();
    expect(body.error).toContain("Too many requests");
  });
});

describe("parseJsonBody", () => {
  it("returns 422 error for invalid JSON", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad-json",
    });
    const result = await parseJsonBody(request);
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(422);
    const body = await result.error!.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("parses valid JSON", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });
    const result = await parseJsonBody(request);
    expect(result.body).toEqual({ ok: true });
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
