import { describe, it, expect } from "vitest";
import {
  checkInSchema,
  chatMessageSchema,
  userIdSchema,
  profileSchema,
  motivationSchema,
} from "@/schemas";

const validUserId = "550e8400-e29b-41d4-a716-446655440000";

const validCheckIn = {
  userId: validUserId,
  journalEntry: "Today was challenging but I made progress.",
  moodScore: 6,
  energyLevel: 5,
  sleepHours: 7,
  studyHours: 6,
  examType: "JEE" as const,
  daysRemaining: 90,
  confidenceLevel: 5,
  anxietyLevel: 4,
};

describe("checkInSchema", () => {
  it("accepts valid input", () => {
    expect(checkInSchema.parse(validCheckIn)).toEqual(validCheckIn);
  });

  it("rejects empty journal", () => {
    expect(() =>
      checkInSchema.parse({ ...validCheckIn, journalEntry: "" })
    ).toThrow();
  });

  it("rejects mood out of range", () => {
    expect(() =>
      checkInSchema.parse({ ...validCheckIn, moodScore: 11 })
    ).toThrow();
  });

  it("rejects invalid exam type", () => {
    expect(() =>
      checkInSchema.parse({ ...validCheckIn, examType: "SAT" })
    ).toThrow();
  });

  it("rejects invalid userId", () => {
    expect(() =>
      checkInSchema.parse({ ...validCheckIn, userId: "not-a-uuid" })
    ).toThrow();
  });

  it("trims journal whitespace", () => {
    const result = checkInSchema.parse({
      ...validCheckIn,
      journalEntry: "  valid entry  ",
    });
    expect(result.journalEntry).toBe("valid entry");
  });
});

describe("chatMessageSchema", () => {
  it("accepts valid message", () => {
    expect(
      chatMessageSchema.parse({ userId: validUserId, message: "Hello coach" })
    ).toEqual({ userId: validUserId, message: "Hello coach" });
  });

  it("rejects empty message", () => {
    expect(() =>
      chatMessageSchema.parse({ userId: validUserId, message: "" })
    ).toThrow();
  });

  it("rejects message over 2000 chars", () => {
    expect(() =>
      chatMessageSchema.parse({ userId: validUserId, message: "x".repeat(2001) })
    ).toThrow();
  });

  it("trims message whitespace", () => {
    const result = chatMessageSchema.parse({
      userId: validUserId,
      message: "  hello coach  ",
    });
    expect(result.message).toBe("hello coach");
  });
});

describe("userIdSchema", () => {
  it("accepts valid UUID", () => {
    expect(userIdSchema.parse({ userId: validUserId })).toEqual({
      userId: validUserId,
    });
  });

  it("rejects invalid UUID", () => {
    expect(() => userIdSchema.parse({ userId: "bad-id" })).toThrow();
  });
});

describe("profileSchema", () => {
  it("trims optional string fields", () => {
    const result = profileSchema.parse({
      userId: validUserId,
      examGoal: "  Top 100  ",
    });
    expect(result.examGoal).toBe("Top 100");
  });

  it("rejects stress triggers over max count", () => {
    expect(() =>
      profileSchema.parse({
        userId: validUserId,
        knownStressTriggers: Array.from({ length: 21 }, (_, i) => `trigger-${i}`),
      })
    ).toThrow();
  });
});

describe("motivationSchema", () => {
  it("accepts null for optional celebration fields from OpenAI", () => {
    const result = motivationSchema.parse({
      affirmation: "You are capable",
      dailyEncouragement: "Keep showing up",
      progressCelebration: null,
      milestoneRecognition: null,
    });
    expect(result.progressCelebration).toBeUndefined();
    expect(result.milestoneRecognition).toBeUndefined();
  });
});
