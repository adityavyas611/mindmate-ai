import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALID_USER_ID,
  OTHER_USER_ID,
  makeJsonRequest,
  makeGetRequest,
  makeInvalidJsonRequest,
  authHeaders,
} from "@/test/api-test-helpers";

vi.mock("@/lib/db/mongodb", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();

vi.mock("@/models", () => ({
  UserProfile: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockFindOneAndUpdate(...args),
  },
}));

import { GET, PUT } from "@/app/api/profile/route";

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ userId: VALID_USER_ID, examType: "JEE" }),
    });
  });

  it("returns 400 for invalid userId", async () => {
    const response = await GET(
      makeGetRequest("http://localhost/api/profile?userId=invalid")
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await GET(
      makeGetRequest(`http://localhost/api/profile?userId=${VALID_USER_ID}`)
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/profile?userId=${VALID_USER_ID}`,
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns profile data", async () => {
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/profile?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.examType).toBe("JEE");
  });

  it("returns 500 when database connection fails", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("MONGODB_URI is not configured"));
    const response = await GET(
      makeGetRequest(
        `http://localhost/api/profile?userId=${VALID_USER_ID}`,
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).not.toContain("MONGODB");
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ userId: VALID_USER_ID, examType: "NEET" }),
    });
  });

  it("returns 422 on invalid body", async () => {
    const response = await PUT(
      makeJsonRequest("http://localhost/api/profile", "PUT", {
        userId: "not-uuid",
        examGoal: "Top rank",
      })
    );
    expect(response.status).toBe(422);
  });

  it("returns 422 on invalid JSON body", async () => {
    const response = await PUT(
      makeInvalidJsonRequest("http://localhost/api/profile", "PUT", authHeaders())
    );
    expect(response.status).toBe(422);
  });

  it("trims and saves profile fields", async () => {
    const response = await PUT(
      makeJsonRequest(
        "http://localhost/api/profile",
        "PUT",
        {
          userId: VALID_USER_ID,
          examType: "NEET",
          examGoal: "  Top 100 rank  ",
        },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(200);
    expect(mockFindOneAndUpdate).toHaveBeenCalled();
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await PUT(
      makeJsonRequest("http://localhost/api/profile", "PUT", {
        userId: VALID_USER_ID,
        examGoal: "Top rank",
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 on user ID mismatch", async () => {
    const response = await PUT(
      makeJsonRequest(
        "http://localhost/api/profile",
        "PUT",
        { userId: VALID_USER_ID, examGoal: "Top rank" },
        { "x-user-id": OTHER_USER_ID }
      )
    );
    expect(response.status).toBe(403);
  });

  it("returns 500 when database connection fails", async () => {
    const { connectDB } = await import("@/lib/db/mongodb");
    vi.mocked(connectDB).mockRejectedValueOnce(new Error("MONGODB_URI is not configured"));
    const response = await PUT(
      makeJsonRequest(
        "http://localhost/api/profile",
        "PUT",
        { userId: VALID_USER_ID, examGoal: "Top rank" },
        { "x-user-id": VALID_USER_ID }
      )
    );
    expect(response.status).toBe(500);
  });
});
