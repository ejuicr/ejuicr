import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AboutPage from "../about/page";
import HelpPage from "../help/page";
import ContributePage from "../contribute/page";

vi.mock("@/lib/config", () => ({
  SUPPORT_EMAIL: "support@example.test",
  FEEDBACK_EMAIL: "feedback@example.test",
  DONATION_LINK: "https://example.test/donate",
}));

// Copy is approved independently of the redesign. Keep these snapshots unchanged
// when restyling these pages, including their optional contact/donation content.
it.each([
  ["About", AboutPage],
  ["Help", HelpPage],
  ["Contribute", ContributePage],
] as const)("preserves the existing %s copy", (_name, Page) => {
  const { container } = render(<Page />);
  const copy = [...container.querySelectorAll("h1, h2, p, li")]
    .map((element) => element.textContent.replace(/\s+/g, " ").trim())
    .join("\n");
  expect(copy).toMatchSnapshot();
});
