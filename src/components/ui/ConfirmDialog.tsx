"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Modal confirmation dialog. The dialog traps focus,
 * closes on Escape or a backdrop click, and restores focus when it closes.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className="confirmation-backdrop"
      hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="panel confirmation-dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <div className="confirmation-copy">{children}</div>
        <div className="confirmation-actions">
          <button type="button" onClick={onClose}>{onConfirm ? "Cancel" : "Close"}</button>
          {onConfirm && <button type="button" className="confirmation-danger" onClick={onConfirm}>{confirmLabel}</button>}
        </div>
      </div>
    </div>
  );
}
