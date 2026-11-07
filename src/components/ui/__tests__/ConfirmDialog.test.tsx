import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("exposes an accessible name and closes on Escape", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="Delete account" confirmLabel="Delete" onConfirm={vi.fn()} onClose={onCancel}>
        <p>This cannot be undone.</p>
      </ConfirmDialog>,
    );

    expect(
      screen.getByRole("dialog", { name: "Delete account" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the dialog and restores it when closed", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();

    const { unmount } = render(
      <ConfirmDialog open title="Confirm" confirmLabel="Delete" onConfirm={vi.fn()} onClose={vi.fn()}>
        <p>Delete this item?</p>
      </ConfirmDialog>,
    );

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" }),
    );

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("keeps Tab focus inside the dialog", () => {
    render(
      <ConfirmDialog open title="Confirm" confirmLabel="Delete" onConfirm={vi.fn()} onClose={vi.fn()}>
        <p>Delete this item?</p>
      </ConfirmDialog>,
    );

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const remove = screen.getByRole("button", { name: "Delete" });

    remove.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    cancel.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(remove);
  });

  it("confirms only through the explicit action and keeps a closed dialog inert", () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmDialog open title="Confirm" confirmLabel="Delete" onConfirm={onConfirm} onClose={vi.fn()}>
        <p>Delete this item?</p>
      </ConfirmDialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    rerender(
      <ConfirmDialog open={false} title="Confirm" confirmLabel="Delete" onConfirm={onConfirm} onClose={vi.fn()}>
        <p>Delete this item?</p>
      </ConfirmDialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
