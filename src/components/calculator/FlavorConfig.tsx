"use client";

import RatioField from "@/components/ui/RatioField";
import type { CalculatorController } from "./useCalculator";

export default function FlavorConfig({
  index,
  calculator,
}: {
  index: number;
  calculator: CalculatorController;
}) {
  const { flavors, handleChangeFlavorPgVg } = calculator;
  const flavor = flavors[index];

  return (
    <div className="flavor-config">
      <RatioField
        label="Base"
        ariaLabel={`Flavor ${index + 1} base`}
        pg={flavor.pg}
        vg={flavor.vg}
        onChange={(value, ingredient) =>
          handleChangeFlavorPgVg(index, value, ingredient)
        }
        pgTestId={`flavor${index + 1}ConfigPgInput`}
        vgTestId={`flavor${index + 1}ConfigVgInput`}
      />
    </div>
  );
}
