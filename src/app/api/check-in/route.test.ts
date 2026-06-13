import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  OTHER_USER_ID,
  makeJsonRequest,
  makeGetRequest,
  makeInvalidJsonRequest,
} from "@/test/api-test-helpers";
import { resetRateLimitStore } from "@/lib/rate-limit";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockAnalyzeCheckIn = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  analyzeCheckIn: (...args: unknown[]) => mockAnalyzeCheckIn(...args),
  generateMindfulnessExercise: vi.fn().mockResolvedValue({
    title: "Breathing",
    type: "breathing",
    durationMinutes: 5,
    instructions: ["Breathe in"],
    adaptationReason: "Low stress",
  }),
  generateMotivation: vi.fn().mockResolvedValue({
    affirmation: "You can do this",
    dailyEncouragement: "Keep going",
  }),
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
  decrypt: vi.fn((text: string) => text.replace("encrypted:", "")),
}));

const mockCreate = vi.fn();
const mockFind = vi.fn();
const mockLimit = vi.fn();
const mockFindOneAndUpdate = vi.fn();

vi.mock("@/models", () => ({
  CheckIn: {
    find: (...args: unknown[]) => mockFind(...args),
    create: (...args: unknown[]) => mockCreate(...args),
  },
  UserProfile: {
    findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
  },
}));

import { POST, GET } from "@/app/api/check-in/route";

const validBody = {
  userId: VALID_USER_ID,
  journalEntry: "Today was a good study day.",
  moodScore: 7,
  energyLevel: 6,
  sleepHours: 7,
  studyHours: 6,
  examType: "JEE",
  daysRemaining: 90,
  confidenceLevel: 6,
  anxietyLevel: 4,
};

describe("POST /api/check-in", () => {
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
    mockAnalyzeCheckIn.mockResolvedValue({
      emotionalState: "calm",
      stressLevel: "low",
      burnoutRisk: "low",
      motivationLevel: "moderate",
      confidenceIndicators: "steady",
      negativeSelfTalkPatterns: [],
      hiddenStressTriggers: [],
      recurringThemes: [],
      productivityImpact: "minimal",
      academicPressureIndicators: [],
      personalizedInsights: ["Keep going"],
      copingStrategies: ["Take breaks"],
      encouragement: "You are doing well",
      wellnessScore: 75,
      wellnessScoreExplanation: "Good balance",
      improvementSuggestions: ["Sleep more"],
      stressPredictorScore: 30,
      stressPredictorExplanation: "Low risk",
      safetyNote: "Seek help if needed",
    });
    mockCreate.mockResolvedValue({
      _id: { toString: () => "checkin-id" },
      createdAt: new Date().toISOString(),
    });
    mockFindOneAndUpdate.mockResolvedValue({});
  });

  it("returns 422 on invalid input", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/check-in", "POST", {
        userId: VALID_USER_ID,
      })
    );
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.success).toBe(false);
  });

  it("returns 422 on invalid JSON body", async () => {
    const response = await POST(
      makeInvalidJsonRequest("http://localhost/api/check-in", "POST", {
        "x-user-id": VALID_USER_ID,
      })
    );
    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/check-in",
        "POST",
        validBody,
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/check-in", "POST", validBody)
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    for (let i = 0; i < 5; i++) {
      await POST(
        makeJsonRequest(
          "http://localhost/api/check-in",
          "POST",
          validBody,
          { "x-user-id": VALID_USER_ID }
        )
      );
    }
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/check-in",
        "POST",
        validBody,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(429);
  });

  it("returns 200 on valid request", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/check-in",
        "POST",
        validBody,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.analysis).toBeDefined();
  });

  it("returns 500 when AI service fails", async () => {
    mockAnalyzeCheckIn.mockRejectedValue(new Error("OPENAI_API_KEY is not configured"));
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/check-in",
        "POST",
        validBody,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("An unexpected error occurred. Please try again later.");
    expect(json.error).not.toContain("OPENAI");
  });
});

describe("GET /api/check-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: { toString: () => "id-1" },
          userId: VALID_USER_ID,
          encryptedJournal: "encrypted:hello",
          moodScore: 7,
          energyLevel: 6,
          sleepHours: 7,
          studyHours: 6,
          examType: "JEE",
          daysRemaining: 90,
          confidenceLevel: 6,
          anxietyLevel: 4,
          analysis: {},
          createdAt: new Date(),
        },
      ]),
    });
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: mockLimit,
      }),
    });
  });

  it("returns 400 for invalid userId", async () => {
    const response = await GET(
      makeGetRequest(`http://localhost/api/check-in?userId=bad-id`)
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid limit over 100", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}&limit=200`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(400);
  });

  it("uses default limit of 30 when omitted", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    expect(mockLimit).toHaveBeenCalledWith(30);
  });

  it("returns 400 for invalid limit", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}&limit=not-a-number`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid limit parameter");
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await GET(
      makeGetRequest(`http://localhost/api/check-in?userId=${VALID_USER_ID}`)
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}`,
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 when database connection fails", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("MONGODB_URI is not configured"));
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
  });

  it("returns decrypted check-ins", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/check-in?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data[0].journalEntry).toBe("hello");
  });
});
