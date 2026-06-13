import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  OTHER_USER_ID,
  makeJsonRequest,
  makeGetRequest,
  makeInvalidJsonRequest,
  authHeaders,
} from "@/test/api-test-helpers";
import { resetRateLimitStore } from "@/lib/rate-limit";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockChatWithCoach = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockInsertMany = vi.fn();

vi.mock("@/lib/ai/openai", () => ({
  chatWithCoach: (...args: unknown[]) => mockChatWithCoach(...args),
}));

vi.mock("@/models", () => ({
  UserProfile: { findOne: (...args: unknown[]) => mockFindOne(...args) },
  CheckIn: {
    find: (...args: unknown[]) => mockFind(...args),
  },
  ChatMessage: {
    find: (...args: unknown[]) => mockFind(...args),
    insertMany: (...args: unknown[]) => mockInsertMany(...args),
  },
}));

import { POST, GET } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
    mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    mockChatWithCoach.mockResolvedValue("I hear you — take a deep breath.");
    mockInsertMany.mockResolvedValue([]);
  });

  it("returns 422 on invalid input", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/chat", "POST", {
        userId: VALID_USER_ID,
        message: "",
      })
    );
    expect(response.status).toBe(422);
  });

  it("returns 422 on invalid JSON body", async () => {
    const response = await POST(
      makeInvalidJsonRequest("http://localhost/api/chat", "POST", authHeaders())
    );
    expect(response.status).toBe(422);
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await POST(
      makeJsonRequest("http://localhost/api/chat", "POST", {
        userId: VALID_USER_ID,
        message: "Hello",
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limit exceeded", async () => {
    for (let i = 0; i < 20; i++) {
      await POST(
        makeJsonRequest(
          "http://localhost/api/chat",
          "POST",
          { userId: VALID_USER_ID, message: `Hello ${i}` },
          authHeaders()
        )
      );
    }
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/chat",
        "POST",
        { userId: VALID_USER_ID, message: "One more" },
        authHeaders()
      )
    );
    expect(response.status).toBe(429);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/chat",
        "POST",
        { userId: VALID_USER_ID, message: "Hello" },
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 200 on valid request", async () => {
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/chat",
        "POST",
        { userId: VALID_USER_ID, message: "Hello coach" },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.reply).toContain("deep breath");
  });

  it("returns 500 when AI service fails", async () => {
    mockChatWithCoach.mockRejectedValue(new Error("OPENAI_API_KEY is not configured"));
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/chat",
        "POST",
        { userId: VALID_USER_ID, message: "Hello" },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).not.toContain("OPENAI");
  });
});

describe("GET /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  });

  it("returns 400 when userId is missing", async () => {
    const response = await GET(makeGetRequest("http://localhost/api/chat"));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid UUID", async () => {
    const response = await GET(
      makeGetRequest("http://localhost/api/chat?userId=not-a-uuid")
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await GET(
      makeGetRequest(`http://localhost/api/chat?userId=${VALID_USER_ID}`)
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/chat?userId=${VALID_USER_ID}`,
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns chat history", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: { toString: () => "msg-1" },
              role: "user",
              content: "Hi",
              createdAt: new Date(),
            },
          ]),
        }),
      }),
    });
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/chat?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data[0].content).toBe("Hi");
  });

  it("returns 500 when database connection fails", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("MONGODB_URI is not configured"));
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/chat?userId=${VALID_USER_ID}`,
        authHeaders()
      )
    );
    expect(response.status).toBe(500);
  });
});
