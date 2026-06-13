import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { VALID_USER_ID } from "@/test/api-test-helpers";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("@/hooks/use-user-id", () => ({
  useUserId: () => VALID_USER_ID,
  api: {
    getChatHistory: vi.fn().mockResolvedValue([]),
    getInsights: vi.fn().mockResolvedValue({ latestAnalysis: null }),
    sendChatMessage: vi.fn().mockResolvedValue({ reply: "I hear you." }),
  },
}));

import ChatPage from "@/app/chat/page";

describe("ChatPage", () => {
  it("renders chat region and message input", async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByRole("region", { name: /chat messages/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/message to ai coach/i)).toBeInTheDocument();
  });

  it("shows validation error for empty message submission", async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/message to ai coach/i)).toBeInTheDocument();
    });
    const input = screen.getByLabelText(/message to ai coach/i);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
