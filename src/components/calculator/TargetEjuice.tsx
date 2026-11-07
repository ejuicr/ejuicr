"use client";

import NumberField from "@/components/ui/NumberField";
import RatioField from "@/components/ui/RatioField";
import type { CalculatorController } from "./useCalculator";

export default function TargetEjuice({
  calculator,
}: {
  calculator: CalculatorController;
}) {
  const {
    targetPg,
    targetVg,
    handleChangeTargetPgVg,
    targetNicStrength,
    handleChangeTargetNicStrength,
    targetAmount,
    handleChangeTargetAmount,
    showNicotine,
  } = calculator;

  return (
    <section className="panel target-panel">
      <div className="section-label">
        <h2>Batch</h2>
      </div>
      <div className="target-fields">
        <NumberField
          inputTestId="targetAmountInput"
          label="Amount"
          unit="mL"
          value={targetAmount}
          min={0}
          max={10000}
          step={10}
          onChange={handleChangeTargetAmount}
        />
        <RatioField
          label="Base"
          ariaLabel="Batch base"
          pg={targetPg}
          vg={targetVg}
          onChange={handleChangeTargetPgVg}
          pgTestId="targetPgInput"
          vgTestId="targetVgInput"
        />
        {showNicotine && (
          <NumberField
            inputTestId="targetNicStrengthInput"
            label="Nicotine Strength"
            unit="mg/mL"
            value={targetNicStrength}
            min={0}
            step={1}
            onChange={handleChangeTargetNicStrength}
          />
        )}
      </div>
    </section>
  );
}
