import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  push: vi.fn(),
  openAuth: vi.fn(),
}));

vi.mock("@/lib/client-api", () => {
  class ApiClientError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiClientError";
    }
  }
  return {
    ApiClientError,
    api: { post: mocks.post, get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/components/auth/AuthDialogContext", () => ({
  useAuthDialog: () => ({ openAuth: mocks.openAuth }),
}));

import { ApiClientError } from "@/lib/client-api";
import UpdatePasswordForm from "../UpdatePasswordForm";

function submitPasswords(password = "new-password") {
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

describe("UpdatePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the reference success state after a reset", async () => {
    mocks.post.mockResolvedValue({ message: "Your password has been changed." });
    render(<UpdatePasswordForm token="token" />);

    submitPasswords();

    expect(
      await screen.findByRole("heading", { name: "Password changed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your password has been changed. You can now log in with the new password.",
      ),
    ).toBeInTheDocument();
  });

  it("treats an invalid or used token as an expired link", async () => {
    mocks.post.mockRejectedValue(
      new ApiClientError(400, "Invalid or expired token."),
    );
    render(<UpdatePasswordForm token="token" />);

    submitPasswords();

    expect(
      await screen.findByRole("heading", { name: "Reset link expired" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This reset link is invalid, expired or has already been used.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Request a new link" }));
    expect(
      screen.getByRole("heading", { name: "Reset password" }),
    ).toBeInTheDocument();
  });

  it("keeps non-token failures as an inline error", async () => {
    mocks.post.mockRejectedValue(
      new ApiClientError(500, "Request failed. Please try again."),
    );
    render(<UpdatePasswordForm token="token" />);

    submitPasswords();

    await waitFor(() =>
      expect(
        screen.getByText("Request failed. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", { name: "Reset link expired" }),
    ).not.toBeInTheDocument();
  });
});
