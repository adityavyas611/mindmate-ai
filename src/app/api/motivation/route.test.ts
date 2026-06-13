import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  OTHER_USER_ID,
  makeJsonRequest,
  makeInvalidJsonRequest,
  authHeaders,
} from "@/test/api-test-helpers";
import { resetRateLimitStore } from "@/lib/rate-limit";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGenerateMotivation = vi.fn();
const mockFind = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  generateMotivation: (...args: unknown[]) => mockGenerateMotivation(...args),
}));

vi.mock("@/models", () => ({
  CheckIn: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

import { POST } from "@/app/api/motivation/route";

describe("POST /api/motivation", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    mockGenerateMotivation.mockResolvedValue({
      affirmation: "You are capable",
      dailyEncouragement: "Keep showing up",
    });
  });

  it("returns 422 on invalid userId", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/motivation", "POST", { userId: "bad" })
    );
    expect(response.status).toBe(422);
  });

  it("returns 422 on invalid JSON body", async () => {
    const response = await POST(
      makeInvalidJsonRequest("http://localhost/api/motivation", "POST", authHeaders())
    );
    expect(response.status).toBe(422);
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/motivation", "POST", { userId: VALID_USER_ID })
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    for (let i = 0; i < 10; i++) {
      await POST(
        makeJsonRequest(
          "http://localhost/api/motivation",
          "POST",
          { userId: VALID_USER_ID },
          authHeaders()
        )
      );
    }
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/motivation",
        "POST",
        { userId: VALID_USER_ID },
        authHeaders()
      )
    );
    expect(response.status).toBe(429);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/motivation",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 200 with motivation content", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/motivation",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.affirmation).toBe("You are capable");
  });

  it("returns 500 when AI service fails", async () => {
    mockGenerateMotivation.mockRejectedValue(new Error("Service unavailable"));
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/motivation",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).not.toContain("Service unavailable");
  });
});
