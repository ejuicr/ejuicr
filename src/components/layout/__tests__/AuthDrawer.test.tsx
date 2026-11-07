import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  refresh: vi.fn(),
  providers: { google: true, twitter: true },
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    providers: mocks.providers,
    refresh: mocks.refresh,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

import AuthDrawer from "../AuthDrawer";

describe("AuthDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.providers = { google: true, twitter: true };
    document.body.style.overflow = "";
  });

  it("opens on the sign-in form with providers and keeps them on signup", () => {
    render(<AuthDrawer open onClose={mocks.onClose} />);

    expect(
      screen.getByRole("dialog", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with X" }),
    ).toBeInTheDocument();
    expect(screen.getByText("or with email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email", { selector: "input" })).toBeVisible();
    expect(
      screen.getByLabelText("Password", { selector: "input" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Sign in with email" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      screen.getByRole("heading", { name: "Create an account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with X" }),
    ).toBeInTheDocument();
    expect(screen.getByText("or with email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email", { selector: "input" })).toBeVisible();
    expect(
      screen.getByLabelText("Confirm password", { selector: "input" }),
    ).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mocks.onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the provider links and divider when no provider is configured", () => {
    mocks.providers = { google: false, twitter: false };
    render(<AuthDrawer open onClose={mocks.onClose} />);

    expect(
      screen.getByLabelText("Email", { selector: "input" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Continue with X" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("or with email")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(
      screen.getByRole("heading", { name: "Create an account" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("or with email")).not.toBeInTheDocument();
  });
});
