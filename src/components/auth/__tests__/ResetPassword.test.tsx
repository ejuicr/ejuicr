import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  onSignIn: vi.fn(),
}));

vi.mock("@/lib/client-api", () => ({
  api: { post: mocks.post },
}));

import ResetPassword from "../ResetPassword";

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue({ message: "Check your email." });
  });

  it("shows the generic confirmation whether or not the email is known", async () => {
    render(<ResetPassword onSignIn={mocks.onSignIn} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "member@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith("/api/user/reset-password", {
        email: "member@example.com",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check your email inbox for a link to change your password.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Return to sign in" }));
    expect(mocks.onSignIn).toHaveBeenCalledTimes(1);
  });
});
