import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState, EmptyState, AlertBanner } from "@/components/shared/page-components";
import { Heart } from "lucide-react";

describe("LoadingState", () => {
  it("renders message with status role", () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading data...");
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No check-ins yet"
        description="Complete your first daily check-in to see insights."
      />
    );
    expect(screen.getByText("No check-ins yet")).toBeInTheDocument();
    expect(
      screen.getByText("Complete your first daily check-in to see insights.")
    ).toBeInTheDocument();
  });
});

describe("AlertBanner", () => {
  it("renders alert with message", () => {
    render(<AlertBanner message="High burnout risk detected" severity="critical" />);
    expect(screen.getByRole("alert")).toHaveTextContent("High burnout risk detected");
  });
});

describe("StatCard", () => {
  it("renders stat value", async () => {
    const { StatCard } = await import("@/components/shared/page-components");
    render(<StatCard title="Wellness Score" value={82} icon={Heart} />);
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("Wellness Score")).toBeInTheDocument();
  });
});
