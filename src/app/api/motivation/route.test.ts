import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  makeJsonRequest,
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
