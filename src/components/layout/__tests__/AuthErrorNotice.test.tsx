import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  pathname: "/",
  replace: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => mocks.showToast,
}));

import AuthErrorNotice from "../AuthErrorNotice";

describe("AuthErrorNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.pathname = "/";
    window.history.replaceState({}, "", "/");
  });

  it("shows the mapped error toast and removes only authError from the URL", () => {
    mocks.searchParams = new URLSearchParams(
      "authError=google-email-unverified&view=compact",
    );
    mocks.pathname = "/recipes";
    window.history.replaceState(
      {},
      "",
      "/recipes?authError=google-email-unverified&view=compact#main",
    );

    render(<AuthErrorNotice />);

    expect(mocks.showToast).toHaveBeenCalledWith(
      "Google has not verified that email address, so it cannot be used to sign in. Verify it with Google or sign up with email instead.",
      "error",
    );
    expect(mocks.replace).toHaveBeenCalledWith("/recipes?view=compact#main", {
      scroll: false,
    });
  });

  it("shows the generic message for an unknown error code", () => {
    mocks.searchParams = new URLSearchParams("authError=unknown-provider");

    render(<AuthErrorNotice />);

    expect(mocks.showToast).toHaveBeenCalledWith(
      "Sign-in failed. Please try again.",
      "error",
    );
  });

  it("shows one toast when StrictMode runs the effect twice", () => {
    mocks.searchParams = new URLSearchParams("authError=twitter-conflict");

    render(
      <StrictMode>
        <AuthErrorNotice />
      </StrictMode>,
    );

    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    expect(mocks.replace).toHaveBeenCalledTimes(1);
  });

  it("does nothing without an authError parameter", () => {
    mocks.searchParams = new URLSearchParams("view=compact");

    render(<AuthErrorNotice />);

    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
