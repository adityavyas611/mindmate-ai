import { describe, it, expect } from "vitest";
import { formatDate, ESCALATION_MESSAGE, average } from "@/lib/utils";

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
