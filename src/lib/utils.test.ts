import { describe, it, expect } from "vitest";
import { formatDate, ESCALATION_MESSAGE, average, shouldShowEscalation } from "@/lib/utils";
import type { AIAnalysis } from "@/schemas";

describe("formatDate", () => {
  it("formats ISO date strings", () => {
    const formatted = formatDate("2026-06-13T10:00:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/Jun/);
  });
});

describe("ESCALATION_MESSAGE", () => {
  it("includes crisis guidance", () => {
    expect(ESCALATION_MESSAGE).toMatch(/counselor|professional/i);
  });
});

describe("average", () => {
  it("computes mean of values", () => {
    expect(average([4, 6, 8])).toBe(6);
  });

  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });
});

describe("shouldShowEscalation", () => {
  it("returns true for severe stress level", () => {
    expect(
      shouldShowEscalation({ stressLevel: "severe" } as AIAnalysis)
    ).toBe(true);
  });

  it("returns true for severe early warning", () => {
    expect(
      shouldShowEscalation({
        stressLevel: "high",
        earlyWarning: { triggered: true, severity: "severe", message: "Get help" },
      } as AIAnalysis)
    ).toBe(true);
  });

  it("returns false when no distress signals", () => {
    expect(shouldShowEscalation(null)).toBe(false);
  });
});
