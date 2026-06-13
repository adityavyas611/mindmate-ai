import { describe, it, expect } from "vitest";
import {
  validateCheckInForm,
  formatCheckInValidationErrors,
} from "@/lib/validation/check-in-form";

const validUserId = "550e8400-e29b-41d4-a716-446655440000";

const validForm = {
  userId: validUserId,
  journalEntry: "Today I studied well.",
  moodScore: 7,
  energyLevel: 6,
  sleepHours: 7,
  studyHours: 6,
  examType: "JEE",
  daysRemaining: 90,
  confidenceLevel: 6,
  anxietyLevel: 4,
};

describe("validateCheckInForm", () => {
  it("accepts valid form values", () => {
    const result = validateCheckInForm(validForm);
    expect(result.success).toBe(true);
  });

  it("trims journal whitespace and validates", () => {
    const result = validateCheckInForm({
      ...validForm,
      journalEntry: "  Valid entry  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.journalEntry).toBe("Valid entry");
    }
  });

  it("rejects whitespace-only journal", () => {
    const result = validateCheckInForm({
      ...validForm,
      journalEntry: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mood score", () => {
    const result = validateCheckInForm({ ...validForm, moodScore: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid exam type", () => {
    const result = validateCheckInForm({ ...validForm, examType: "SAT" });
    expect(result.success).toBe(false);
  });

  it("returns readable error messages", () => {
    const result = validateCheckInForm({ ...validForm, journalEntry: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatCheckInValidationErrors(result).length).toBeGreaterThan(0);
    }
  });
});
