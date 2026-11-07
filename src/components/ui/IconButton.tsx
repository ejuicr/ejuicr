"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

/** Small icon-only action used by the Astra calculator and auth drawer. */
export default function IconButton({
  label,
  onClick,
  children,
  testId,
  expanded,
  controls,
  selected = false,
  danger = false,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  testId?: string;
  expanded?: boolean;
  controls?: string;
  selected?: boolean;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={clsx(
        "icon-button",
        selected && "selected",
        danger && "remove",
        className,
      )}
    >
      {children}
    </button>
  );
}
