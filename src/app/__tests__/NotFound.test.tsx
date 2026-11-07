import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import NotFound from "../not-found";

describe("NotFound", () => {
  it("keeps the existing guidance and support route", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: "Page Not Found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "support" })).toHaveAttribute(
      "href",
      "/help",
    );
  });
});
