"use client";

/** PG/VG percentage pair used by batch, nicotine, and flavor carriers. */
export default function RatioField({
  label,
  ariaLabel,
  pg,
  vg,
  onChange,
  pgTestId,
  vgTestId,
}: {
  label: string;
  ariaLabel: string;
  pg: number;
  vg: number;
  onChange: (value: string | number, ingredient: "pg" | "vg") => void;
  pgTestId?: string;
  vgTestId?: string;
}) {
  return (
    <fieldset className="ratio-field">
      <legend>{label}</legend>
      <div className="ratio-inputs">
        <label>
          <span>PG</span>
          <input
            data-testid={pgTestId}
            type="number"
            min="0"
            max="100"
            step="any"
            aria-label={`${ariaLabel} PG`}
            value={String(pg)}
            onChange={(event) => onChange(event.target.value, "pg")}
          />
          <span>%</span>
        </label>
        <span className="ratio-divider">/</span>
        <label>
          <span>VG</span>
          <input
            data-testid={vgTestId}
            type="number"
            min="0"
            max="100"
            step="any"
            aria-label={`${ariaLabel} VG`}
            value={String(vg)}
            onChange={(event) => onChange(event.target.value, "vg")}
          />
          <span>%</span>
        </label>
      </div>
    </fieldset>
  );
}
