import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// jest-axe matcher types differ slightly from vitest's MatchersObject
expect.extend(toHaveNoViolations as unknown as Parameters<typeof expect.extend>[0]);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
});
