"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import IconButton from "@/components/ui/IconButton";
import NumberField from "@/components/ui/NumberField";
import FlavorConfig from "./FlavorConfig";
import type { CalculatorController } from "./useCalculator";

export default function Flavor({
  index,
  calculator,
}: {
  index: number;
  calculator: CalculatorController;
}) {
  const {
    flavors,
    handleChangeFlavorName,
    handleChangeFlavorPercentage,
    handleRemoveFlavor,
  } = calculator;
  const [flavorConfigOpen, setFlavorConfigOpen] = useState(false);

  const { name, percentage } = flavors[index];
  const displayName = name || "flavor";

  return (
    <div className="flavor-item">
      <div className="flavor-row">
        <label className="flavor-name">
          <span className="sr-only">Flavor {index + 1} name</span>
          <input
            data-testid={`flavor${index + 1}NameInput`}
            type="text"
            maxLength={60}
            aria-label={`Flavor ${index + 1} name`}
            placeholder="Flavor name"
            value={name}
            onChange={(event) =>
              handleChangeFlavorName(index, event.target.value)
            }
          />
        </label>
        <NumberField
          compact
          inputTestId={`flavor${index + 1}PercentInput`}
          incrementTestId={`flavor${index + 1}PercentIncBtn`}
          decrementTestId={`flavor${index + 1}PercentDecBtn`}
          label={`Flavor ${index + 1} percentage`}
          value={percentage}
          unit="%"
          min={0}
          max={100}
          step={0.5}
          onChange={(value) => handleChangeFlavorPercentage(index, value)}
        />
        <IconButton
          testId={`flavor${index + 1}ConfigBtn`}
          label={`Configure ${displayName} carrier`}
          expanded={flavorConfigOpen}
          selected={flavorConfigOpen}
          onClick={() => setFlavorConfigOpen((open) => !open)}
        >
          <FontAwesomeIcon icon={faGear} />
        </IconButton>
        <IconButton
          testId={`flavor${index + 1}DeleteBtn`}
          label={`Remove ${displayName}`}
          danger
          onClick={() => {
            handleRemoveFlavor(index);
            setFlavorConfigOpen(false);
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
      </div>
      {flavorConfigOpen && (
        <FlavorConfig index={index} calculator={calculator} />
      )}
    </div>
  );
}
