"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPlus } from "@fortawesome/free-solid-svg-icons";
import IconButton from "@/components/ui/IconButton";
import { formatMeasurement } from "@/lib/helpers";
import Flavor from "./Flavor";
import NicConfig from "./NicConfig";
import type { CalculatorController } from "./useCalculator";

export default function Ingredients({
  calculator,
}: {
  calculator: CalculatorController;
}) {
  const { nicConfig, flavors, showNicotine, handleAddFlavor } = calculator;

  const [nicConfigOpen, setNicConfigOpen] = useState(false);

  const nicotineSummary = [
    `${formatMeasurement(nicConfig.strength)}mg/mL`,
    ...(nicConfig.pg > 0 ? [`${formatMeasurement(nicConfig.pg)}% PG`] : []),
    ...(nicConfig.vg > 0 ? [`${formatMeasurement(nicConfig.vg)}% VG`] : []),
  ].join(" · ");

  return (
    <div className="ingredients-stack">
      {showNicotine && (
        <section className="panel nicotine-panel">
          <div className="section-label">
            <h2>
              <span className="nicotine-title-full">Undiluted Nicotine</span>
              <span className="nicotine-title-short">Undiluted Nic.</span>
            </h2>
            <div className="nicotine-summary">
              <span className="quiet">{nicotineSummary}</span>
              <IconButton
                testId="nicConfigBtn"
                label={`${nicConfigOpen ? "Collapse" : "Expand"} nicotine base`}
                expanded={nicConfigOpen}
                controls="nicotine-base-controls"
                selected={nicConfigOpen}
                onClick={() => setNicConfigOpen((open) => !open)}
              >
                <FontAwesomeIcon icon={faGear} />
              </IconButton>
            </div>
          </div>
          <NicConfig calculator={calculator} open={nicConfigOpen} />
        </section>
      )}

      <section className="panel ingredient-panel">
        <div className="section-label flavor-heading">
          <h2>Flavors</h2>
        </div>
        <div className="flavor-list">
          {flavors.map((_flavor, index) => (
            <Flavor key={index} index={index} calculator={calculator} />
          ))}
          {!flavors.length && (
            <p className="empty-inline">
              No flavors added. Add a flavor to include it in the calculation.
            </p>
          )}
        </div>
        <button
          data-testid="flavorAddBtn"
          type="button"
          className="add-flavor-button"
          onClick={handleAddFlavor}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add flavor</span>
        </button>
      </section>
    </div>
  );
}
