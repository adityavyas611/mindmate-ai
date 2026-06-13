import { describe, it, expect } from "vitest";
import {
  trendBadgeVariant,
  severityBadgeVariant,
  scoreBadgeVariant,
} from "@/types/api";

describe("badge variant helpers", () => {
  it("maps trends to badge variants", () => {
    expect(trendBadgeVariant("improving")).toBe("success");
    expect(trendBadgeVariant("declining")).toBe("danger");
    expect(trendBadgeVariant("stable")).toBe("info");
  });

  it("maps severity levels to badge variants", () => {
    expect(severityBadgeVariant("low")).toBe("success");
    expect(severityBadgeVariant("moderate")).toBe("warning");
    expect(severityBadgeVariant("high")).toBe("danger");
  });

  it("maps score strings to badge variants", () => {
    expect(scoreBadgeVariant("80/100")).toBe("success");
    expect(scoreBadgeVariant("50/100")).toBe("warning");
    expect(scoreBadgeVariant("30/100")).toBe("danger");
  });
});
