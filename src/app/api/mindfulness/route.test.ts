import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  makeJsonRequest,
} from "@/test/api-test-helpers";
import { resetRateLimitStore } from "@/lib/rate-limit";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGenerateMindfulness = vi.fn();
const mockFindOne = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  generateMindfulnessExercise: (...args: unknown[]) => mockGenerateMindfulness(...args),
}));

vi.mock("@/models", () => ({
  CheckIn: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}));

import { POST } from "@/app/api/mindfulness/route";

describe("POST /api/mindfulness", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
    mockFindOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          moodScore: 5,
          energyLevel: 5,
          sleepHours: 7,
          studyHours: 6,
          examType: "JEE",
          daysRemaining: 90,
          confidenceLevel: 5,
          anxietyLevel: 6,
          analysis: { stressLevel: "moderate", burnoutRisk: "low" },
        }),
      }),
    });
    mockGenerateMindfulness.mockResolvedValue({
      title: "Breathing",
      type: "breathing",
      durationMinutes: 5,
      instructions: ["Breathe in"],
      adaptationReason: "High anxiety",
    });
  });

  it("returns 422 on invalid userId", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/mindfulness", "POST", { userId: "bad" })
    );
    expect(response.status).toBe(422);
  });

  it("returns 400 when no check-in exists", async () => {
    mockFindOne.mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/mindfulness",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 with exercise on valid request", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/mindfulness",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.title).toBe("Breathing");
  });

  it("returns 500 when AI service fails", async () => {
    mockGenerateMindfulness.mockRejectedValue(new Error("OpenAI down"));
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/mindfulness",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
  });
});
