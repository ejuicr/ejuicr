"use client";

import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { roundToTwoDecimalPlaces } from "@/lib/helpers";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: string | number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  compact?: boolean;
  inputTestId?: string;
  incrementTestId?: string;
  decrementTestId?: string;
}

/** A labelled number input with decrement/increment controls. */
export default function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min,
  max,
  compact = false,
  inputTestId,
  incrementTestId,
  decrementTestId,
}: NumberFieldProps) {
  const inputId = useId();

  const nudge = (delta: number) => {
    let next = value + delta;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(roundToTwoDecimalPlaces(next));
  };

  return (
    <div className={clsx("number-field", compact && "compact")}>
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="number-control">
        <button
          type="button"
          data-testid={decrementTestId}
          className="step"
          aria-label={`Decrease ${label}`}
          onClick={() => nudge(-step)}
          disabled={min !== undefined && value <= min}
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <input
          id={inputId}
          data-testid={inputTestId}
          type="number"
          aria-label={label}
          value={String(value)}
          min={min}
          max={max}
          step="any"
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && <span className="unit">{unit}</span>}
        <button
          type="button"
          data-testid={incrementTestId}
          className="step"
          aria-label={`Increase ${label}`}
          onClick={() => nudge(step)}
          disabled={max !== undefined && value >= max}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
}
