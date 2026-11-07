"use client";

import { formatMeasurement, isResultsInvalid } from "@/lib/helpers";
import type { CalculatorController } from "./useCalculator";

export default function Results({
  calculator,
}: {
  calculator: CalculatorController;
}) {
  const {
    targetAmount,
    units,
    error,
    showNicotine,
    nicResults,
    flavors,
    pgRequired,
    vgRequired,
    nicPercentage,
    pgPercentage,
    vgPercentage,
    pgWeight,
    vgWeight,
    nicInvalid,
    pgInvalid,
    vgInvalid,
  } = calculator;

  const rows: Array<{
    name: string;
    percentage: number;
    amount: number;
    weight: number;
    color: string;
    invalid: boolean;
  }> = [
    {
      name: "PG",
      percentage: pgPercentage,
      amount: pgRequired,
      weight: pgWeight,
      color: "cyan",
      invalid: pgInvalid,
    },
    {
      name: "VG",
      percentage: vgPercentage,
      amount: vgRequired,
      weight: vgWeight,
      color: "purple",
      invalid: vgInvalid,
    },
    ...(showNicotine
      ? [
          {
            name: "Nicotine",
            percentage: nicPercentage,
            amount: nicResults.amount,
            weight: nicResults.weight,
            color: "pink",
            invalid: nicInvalid,
          },
        ]
      : []),
    ...flavors.map((flavor) => ({
      name: flavor.name || "Unnamed flavor",
      percentage: flavor.percentage,
      amount: flavor.amount,
      weight: flavor.weight,
      color: "yellow",
      invalid: isResultsInvalid(
        flavor.percentage,
        flavor.amount,
        flavor.weight,
      ),
    })),
  ];

  return (
    <section className="panel results-panel">
      <div className="section-label">
        <h2>Your Mix</h2>
        <span className="quiet">{formatMeasurement(targetAmount)} mL</span>
      </div>
      {error && (
        <div data-testid="errorMessage" className="message error" role="alert">
          {error}
        </div>
      )}
      <table className="results-table">
        <caption className="sr-only">
          Ingredient quantities. Every value includes its unit.
        </caption>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={row.invalid ? "invalid-row" : undefined}>
              <th scope="row">
                <i className={`dot ${row.color}`} aria-hidden="true" />
                {row.name}
              </th>
              <td>
                {formatMeasurement(row.percentage)}
                <span>%</span>
              </td>
              {units !== "weight" && (
                <td>
                  {formatMeasurement(row.amount)}
                  <span>mL</span>
                </td>
              )}
              {units !== "volume" && (
                <td>
                  {formatMeasurement(row.weight)}
                  <span>g</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
