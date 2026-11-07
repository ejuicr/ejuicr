import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider, { useToast } from "../Toast";

function Trigger() {
  const showToast = useToast();
  return (
    <button type="button" onClick={() => showToast("Recipe saved.")}>
      Show toast
    </button>
  );
}

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("dismisses a toast after 3.8 seconds", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    expect(screen.getByText("Recipe saved.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3799);
    });
    expect(screen.getByText("Recipe saved.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText("Recipe saved.")).toBeNull();
  });
});
