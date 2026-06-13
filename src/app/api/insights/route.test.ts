import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  OTHER_USER_ID,
  makeJsonRequest,
  makeGetRequest,
} from "@/test/api-test-helpers";
import { resetRateLimitStore } from "@/lib/rate-limit";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockGeneratePatternInsights = vi.fn();
const mockFind = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  generatePatternInsights: (...args: unknown[]) => mockGeneratePatternInsights(...args),
}));

vi.mock("@/models", () => ({
  CheckIn: {
    find: (...args: unknown[]) => mockFind(...args),
  },
}));

import { GET, POST } from "@/app/api/insights/route";

function mockCheckIns(entries: unknown[]) {
  mockFind.mockReturnValue({
    sort: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(entries),
      }),
    }),
  });
}

describe("GET /api/insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckIns([]);
  });

  it("returns 400 for invalid userId", async () => {
    const response = await GET(
      makeGetRequest(`http://localhost/api/insights?userId=bad-id`)
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/insights?userId=${VALID_USER_ID}`,
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 200 with wellness data", async () => {
    mockCheckIns([
      {
        createdAt: new Date(),
        moodScore: 7,
        energyLevel: 6,
        sleepHours: 7,
        studyHours: 6,
        confidenceLevel: 6,
        anxietyLevel: 4,
        examType: "JEE",
        daysRemaining: 90,
        analysis: { wellnessScore: 72, stressPredictorScore: 35 },
      },
    ]);
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/insights?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.totalCheckIns).toBe(1);
    expect(json.data.wellnessScore.overall).toBeGreaterThan(0);
  });
});

describe("POST /api/insights", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
  });

  it("returns 422 on invalid body", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/insights", "POST", { userId: "bad" })
    );
    expect(response.status).toBe(422);
  });

  it("returns 400 when fewer than 2 check-ins", async () => {
    mockCheckIns([
      {
        createdAt: new Date(),
        moodScore: 7,
        energyLevel: 6,
        sleepHours: 7,
        studyHours: 6,
        confidenceLevel: 6,
        anxietyLevel: 4,
        examType: "JEE",
        daysRemaining: 90,
      },
    ]);
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/insights",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(400);
  });

  it("returns 500 when AI service fails", async () => {
    mockCheckIns([
      {
        createdAt: new Date(),
        moodScore: 7,
        energyLevel: 6,
        sleepHours: 7,
        studyHours: 6,
        confidenceLevel: 6,
        anxietyLevel: 4,
        examType: "JEE",
        daysRemaining: 90,
      },
      {
        createdAt: new Date(),
        moodScore: 6,
        energyLevel: 5,
        sleepHours: 6,
        studyHours: 5,
        confidenceLevel: 5,
        anxietyLevel: 5,
        examType: "JEE",
        daysRemaining: 89,
      },
    ]);
    mockGeneratePatternInsights.mockRejectedValue(new Error("OpenAI API error"));
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/insights",
        "POST",
        { userId: VALID_USER_ID },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("An unexpected error occurred. Please try again later.");
  });
});
