import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  user: null as Record<string, unknown> | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mocks.user,
    loading: false,
    providers: { google: false, twitter: false },
    refresh: vi.fn(),
    setUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

import Sidebar from "../Sidebar";

const signedInUser = {
  _id: "user-1",
  email: "member@example.com",
  hasPassword: true,
  hasGoogleLinked: false,
  hasTwitterLinked: false,
};

describe("App navigation", () => {
  beforeEach(() => {
    mocks.pathname = "/";
    mocks.user = null;
  });

  it("shows the calculator and sign-in action while signed out", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Calculator" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
    expect(screen.queryByRole("link", { name: "Recipes" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
    expect(screen.queryByText("Sign out")).toBeNull();
  });

  it("shows the signed-in routes and account link without a sign-out action", () => {
    mocks.user = signedInUser;
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Recipes" })).toHaveAttribute(
      "href",
      "/recipes",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/myaccount",
    );
    expect(screen.getByRole("link", { name: "View account" })).toHaveAttribute(
      "href",
      "/myaccount",
    );
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.queryByText("Sign out")).toBeNull();
    expect(screen.queryByAltText("Your profile picture")).toBeNull();
    expect(screen.getByRole("link", { name: "View account" }).querySelector(".user-avatar svg")).toBeInTheDocument();
  });

  it("marks the recipes route active for a saved recipe", () => {
    mocks.pathname = "/recipes/recipe-1";
    mocks.user = signedInUser;
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Recipes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Calculator" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it.each([
    [{ googlePicture: "https://example.test/google.jpg", twitterPicture: "https://example.test/twitter.jpg" }, "https://example.test/google.jpg"],
    [{ twitterPicture: "data:image/png;base64,avatar" }, "data:image/png;base64,avatar"],
  ])("uses the same profile picture preference as the account page: %j", (pictures, expected) => {
    mocks.user = { ...signedInUser, ...pictures };
    render(<Sidebar />);
    expect(screen.getByAltText("Your profile picture")).toHaveAttribute("src", expected);
    expect(screen.getByAltText("Your profile picture")).toHaveAttribute("referrerpolicy", "no-referrer");
  });
});
