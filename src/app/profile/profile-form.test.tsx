import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { VALID_USER_ID } from "@/test/api-test-helpers";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProfileForm } from "@/app/profile/page";

vi.mock("@/hooks/use-user-id", () => ({
  api: {
    updateProfile: vi.fn().mockResolvedValue({ userId: VALID_USER_ID }),
  },
}));

describe("ProfileForm", () => {
  it("shows validation error for exam goal over max length", async () => {
    renderWithProviders(
      <ProfileForm
        userId={VALID_USER_ID}
        initialData={{ userId: VALID_USER_ID, examType: "JEE" }}
      />
    );
    fireEvent.change(screen.getByLabelText(/exam goal/i), {
      target: { value: "x".repeat(501) },
    });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).not.toHaveTextContent("");
    });
  });

  it("associates validation errors with form fields", async () => {
    renderWithProviders(
      <ProfileForm
        userId={VALID_USER_ID}
        initialData={{ userId: VALID_USER_ID, examType: "JEE" }}
      />
    );
    fireEvent.change(screen.getByLabelText(/exam goal/i), {
      target: { value: "x".repeat(501) },
    });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/exam goal/i)).toHaveAttribute("aria-invalid", "true");
    });
  });
});
