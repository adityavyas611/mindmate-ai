import { describe, it, expect } from "vitest";
import {
  buildProfilePayload,
  formatProfileValidationErrors,
} from "@/lib/validation/profile-form";

const VALID_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("buildProfilePayload", () => {
  it("parses valid profile fields", () => {
    const result = buildProfilePayload(VALID_USER_ID, {
      examType: "JEE",
      examGoal: "Top rank",
      motivationalPreferences: "Short affirmations",
      stressTriggersText: "mock tests, peer comparison",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.knownStressTriggers).toEqual(["mock tests", "peer comparison"]);
    }
  });

  it("returns validation errors for invalid exam goal length", () => {
    const result = buildProfilePayload(VALID_USER_ID, {
      examGoal: "x".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatProfileValidationErrors(result).length).toBeGreaterThan(0);
    }
  });
});
