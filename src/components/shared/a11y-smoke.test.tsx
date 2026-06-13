import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  QueryErrorState,
} from "@/components/shared/page-components";

describe("accessibility smoke tests", () => {
  it("PageHeader has no axe violations", async () => {
    const { container } = render(
      <PageHeader title="Daily Check-In" description="Share how you are feeling." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("LoadingState has no axe violations", async () => {
    const { container } = render(<LoadingState message="Loading data..." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState has no axe violations", async () => {
    const { container } = render(
      <EmptyState title="No data" description="Complete a check-in first." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("QueryErrorState has no axe violations", async () => {
    const { container } = render(
      <QueryErrorState message="Network error" onRetry={() => undefined} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
