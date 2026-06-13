import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { VALID_USER_ID } from "@/test/api-test-helpers";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-user-id", () => ({
  useUserId: () => VALID_USER_ID,
  api: {
    submitCheckIn: vi.fn(),
  },
}));

import CheckInPage from "@/app/check-in/page";

describe("CheckInPage", () => {
  it("shows validation error when journal is empty on submit", async () => {
    renderWithProviders(<CheckInPage />);
    fireEvent.click(
      screen.getByRole("button", { name: /submit check-in/i })
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).not.toHaveTextContent("");
    });
    expect(screen.getByLabelText(/journal entry/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("renders page heading", () => {
    renderWithProviders(<CheckInPage />);
    expect(screen.getByRole("heading", { level: 1, name: /daily check-in/i })).toBeInTheDocument();
  });
});
