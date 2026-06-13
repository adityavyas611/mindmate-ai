import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  validateCheckInForm,
  formatCheckInValidationErrors,
} from "@/lib/validation/check-in-form";

const validUserId = "550e8400-e29b-41d4-a716-446655440000";

function CheckInFormMock() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const journal = (form.elements.namedItem("journal") as HTMLTextAreaElement).value;
    const result = validateCheckInForm({
      userId: validUserId,
      journalEntry: journal.trim(),
      moodScore: 6,
      energyLevel: 6,
      sleepHours: 7,
      studyHours: 6,
      examType: "JEE",
      daysRemaining: 90,
      confidenceLevel: 6,
      anxietyLevel: 5,
    });

    const errorEl = form.querySelector("#form-error");
    if (!result.success) {
      if (errorEl) {
        errorEl.textContent = formatCheckInValidationErrors(result);
      }
      return;
    }
    if (errorEl) errorEl.textContent = "";
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="journal">Journal entry</label>
      <textarea id="journal" name="journal" aria-describedby="form-error" />
      <p id="form-error" role="alert" className="text-red-600" />
      <button type="submit">Submit Check-In</button>
    </form>
  );
}

describe("Check-in form validation (component)", () => {
  it("shows validation error on empty journal submit", () => {
    render(<CheckInFormMock />);
    fireEvent.click(screen.getByRole("button", { name: /submit check-in/i }));
    expect(screen.getByRole("alert").textContent).not.toBe("");
    expect(screen.getByLabelText(/journal entry/i)).toHaveAttribute(
      "aria-describedby",
      "form-error"
    );
  });

  it("clears error on valid journal submit", () => {
    render(<CheckInFormMock />);
    fireEvent.change(screen.getByLabelText(/journal entry/i), {
      target: { value: "Today was productive." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit check-in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("");
  });
});
