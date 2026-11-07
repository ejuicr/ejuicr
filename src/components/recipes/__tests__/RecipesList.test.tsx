import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/client-api", () => ({
  api: { get: mocks.get, delete: mocks.delete },
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import RecipesList from "../RecipesList";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("RecipesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sorts real loaded recipes by last updated, then by title", async () => {
    mocks.get.mockResolvedValue([
      {
        _id: "older",
        name: "Alpha mix",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        _id: "newer",
        name: "Zeta mix",
        updatedAt: "2026-02-01T00:00:00.000Z",
      },
    ]);

    render(<RecipesList />);

    const list = await screen.findByRole("list");
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(
      "Zeta mix",
    );

    fireEvent.change(screen.getByLabelText("Sort recipes"), {
      target: { value: "title" },
    });

    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent(
      "Alpha mix",
    );
  });

  it("closes the confirmation before the delete request settles", async () => {
    const deletion = deferred<unknown>();
    mocks.get.mockResolvedValue([
      { _id: "r1", name: "Mango mix", updatedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    mocks.delete.mockReturnValue(deletion.promise);

    render(<RecipesList />);

    await screen.findByRole("link", { name: /Mango mix/ });
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Mango mix" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Delete “Mango mix”?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.delete).toHaveBeenCalledWith("/api/recipes/r1");

    await act(async () => deletion.resolve({ id: "r1" }));

    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("keeps a failed deletion on screen with an inline error", async () => {
    mocks.get.mockResolvedValue([
      { _id: "r1", name: "Mango mix", updatedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    mocks.delete.mockRejectedValue(new Error("Could not delete that recipe."));

    render(<RecipesList />);

    await screen.findByRole("link", { name: /Mango mix/ });
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Mango mix" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not delete that recipe.",
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Mango mix");
  });

  it("renders the empty state and retries a failed load", async () => {
    mocks.get
      .mockRejectedValueOnce(new Error("Recipes are unavailable."))
      .mockResolvedValueOnce([]);

    render(<RecipesList />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Recipes are unavailable.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No saved recipes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open calculator/ })).toHaveAttribute(
      "href",
      "/",
    );
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
});
