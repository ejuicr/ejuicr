"use client";

import NumberField from "@/components/ui/NumberField";
import RatioField from "@/components/ui/RatioField";
import type { CalculatorController } from "./useCalculator";

export default function NicConfig({
  calculator,
  open,
}: {
  calculator: CalculatorController;
  open: boolean;
}) {
  const {
    nicConfig,
    handleChangeNicConfigStrength,
    handleChangeNicConfigPgVg,
  } = calculator;

  return (
    <div
      className="nicotine-fields"
      id="nicotine-base-controls"
      hidden={!open}
    >
      <NumberField
        inputTestId="nicConfigStrengthInput"
        incrementTestId="nicConfigStrengthIncBtn"
        decrementTestId="nicConfigStrengthDecBtn"
        label="Undiluted Strength"
        unit="mg/mL"
        value={nicConfig.strength}
        min={0}
        max={1000}
        step={5}
        onChange={handleChangeNicConfigStrength}
      />
      <RatioField
        label="Base"
        ariaLabel="Undiluted nicotine base"
        pg={nicConfig.pg}
        vg={nicConfig.vg}
        onChange={handleChangeNicConfigPgVg}
        pgTestId="nicConfigPgInput"
        vgTestId="nicConfigVgInput"
      />
    </div>
  );
}
