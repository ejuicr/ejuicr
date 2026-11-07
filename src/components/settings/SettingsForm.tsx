"use client";

import { useEffect, useState, type FormEvent } from "react";
import NumberField from "@/components/ui/NumberField";
import RatioField from "@/components/ui/RatioField";
import { ErrorMessage } from "@/components/ui/Messages";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client-api";
import {
  parseNumberInput,
  roundToTwoDecimalPlaces,
  validatePgVgValue,
} from "@/lib/helpers";
import type { MixingUnits, SettingsData } from "@/types";

type SettingsResponse = SettingsData | Record<string, never>;

/** The settings endpoint returns `{}` until the user has saved defaults. */
function hasSettings(value: SettingsResponse): value is SettingsData {
  return "base" in value;
}

export default function SettingsForm() {
  const showToast = useToast();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mixingUnits, setMixingUnits] = useState<MixingUnits>("both");
  const [targetPg, setTargetPg] = useState(30);
  const [targetVg, setTargetVg] = useState(70);
  const [targetNicStrength, setTargetNicStrength] = useState(6);
  const [targetAmount, setTargetAmount] = useState(30);
  const [zeroNicotineMode, setZeroNicotineMode] = useState(false);
  const [nicConfig, setNicConfig] = useState({
    strength: 100,
    pg: 100,
    vg: 0,
  });
  const [flavorConfig, setFlavorConfig] = useState({
    percentage: 5,
    pg: 100,
    vg: 0,
  });

  useEffect(() => {
    let cancelled = false;

    api
      .get<SettingsResponse>("/api/settings")
      .then((data) => {
        if (cancelled) return;
        if (hasSettings(data)) {
          setTheme(data.theme);
          setMixingUnits(data.units);
          setTargetPg(data.base.pg);
          setTargetVg(data.base.vg);
          setTargetNicStrength(data.strength);
          setTargetAmount(data.amount);
          setZeroNicotineMode(data.zeroNicotineMode);
          setNicConfig({
            strength: data.nicotine.strength,
            pg: data.nicotine.base.pg,
            vg: data.nicotine.base.vg,
          });
          setFlavorConfig({
            percentage: data.flavor.percentage,
            pg: data.flavor.base.pg,
            vg: data.flavor.base.vg,
          });
        }
        setIsLoaded(true);
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load settings.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const handleRetryLoad = () => {
    setError("");
    setIsLoading(true);
    setIsLoaded(false);
    setRequestId((current) => current + 1);
  };

  const handleChangeTargetPgVg = (
    value: string | number,
    ingredient: "pg" | "vg" = "pg",
  ) => {
    const validatedValue = validatePgVgValue(value);
    setTargetPg(ingredient === "vg" ? 100 - validatedValue : validatedValue);
    setTargetVg(ingredient === "vg" ? validatedValue : 100 - validatedValue);
  };

  const handleChangeTargetNicStrength = (value: string | number) => {
    setTargetNicStrength(roundToTwoDecimalPlaces(parseNumberInput(value)));
  };

  const handleChangeTargetAmount = (value: string | number) => {
    setTargetAmount(roundToTwoDecimalPlaces(parseNumberInput(value)));
  };

  const handleChangeNicConfigStrength = (value: string | number) => {
    const parsedValue = parseNumberInput(value);
    setNicConfig((current) => ({
      ...current,
      strength: parsedValue > 1000 ? 1000 : Math.round(parsedValue),
    }));
  };

  const handleChangeNicConfigPgVg = (
    value: string | number,
    ingredient: "pg" | "vg" = "pg",
  ) => {
    const validatedValue = validatePgVgValue(value);
    setNicConfig((current) => ({
      ...current,
      pg: ingredient === "vg" ? 100 - validatedValue : validatedValue,
      vg: ingredient === "vg" ? validatedValue : 100 - validatedValue,
    }));
  };

  const handleChangeFlavorConfigPercentage = (value: string | number) => {
    const parsedValue = parseNumberInput(value);
    setFlavorConfig((current) => ({
      ...current,
      percentage: parsedValue > 100 ? 100 : roundToTwoDecimalPlaces(parsedValue),
    }));
  };

  const handleChangeFlavorConfigPgVg = (
    value: string | number,
    ingredient: "pg" | "vg" = "pg",
  ) => {
    const validatedValue = validatePgVgValue(value);
    setFlavorConfig((current) => ({
      ...current,
      pg: ingredient === "vg" ? 100 - validatedValue : validatedValue,
      vg: ingredient === "vg" ? validatedValue : 100 - validatedValue,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const newSettings = {
      theme,
      units: mixingUnits,
      base: {
        pg: targetPg,
        vg: targetVg,
      },
      strength: targetNicStrength,
      amount: targetAmount,
      zeroNicotineMode,
      nicotine: {
        strength: nicConfig.strength,
        base: {
          pg: nicConfig.pg,
          vg: nicConfig.vg,
        },
      },
      flavor: {
        percentage: flavorConfig.percentage,
        base: {
          pg: flavorConfig.pg,
          vg: flavorConfig.vg,
        },
      },
    };

    try {
      await api.post("/api/settings", newSettings);
      showToast("Settings saved. New batches will use these defaults.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to save settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <h1 className="recipe-heading">Calculator Defaults</h1>
      {isLoading ? (
        <div className="list-state" role="status">
          <span className="loading-dot" aria-hidden="true" />
          Loading settings…
        </div>
      ) : !isLoaded ? (
        <div className="settings-load-state">
          <ErrorMessage>{error || "Failed to load settings."}</ErrorMessage>
          <button type="button" className="primary" onClick={handleRetryLoad}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="settings-section">
            <div className="settings-description">
              <h2>Mixing Units</h2>
              <p>Choose how amounts appear in your results.</p>
            </div>
            <div className="settings-controls">
              <label className="select-field">
                <span className="sr-only">Mixing units</span>
                <select
                  aria-label="Mixing units"
                  value={mixingUnits}
                  onChange={(event) =>
                    setMixingUnits(event.target.value as MixingUnits)
                  }
                >
                  <option value="both">Volume &amp; Weight · mL &amp; g</option>
                  <option value="volume">Volume · mL</option>
                  <option value="weight">Weight · g</option>
                </select>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-description">
              <h2>Batch</h2>
              <p>Defaults for opening the calculator.</p>
            </div>
            <div className="settings-controls">
              <RatioField
                label="Base"
                ariaLabel="Batch base"
                pg={targetPg}
                vg={targetVg}
                onChange={handleChangeTargetPgVg}
                pgTestId="settingsTargetPgInput"
                vgTestId="settingsTargetVgInput"
              />
              <NumberField
                label="Amount"
                unit="mL"
                value={targetAmount}
                min={0}
                max={10000}
                step={10}
                onChange={handleChangeTargetAmount}
                inputTestId="settingsTargetAmountInput"
              />
              <NumberField
                label="Nicotine Strength"
                unit="mg/mL"
                value={targetNicStrength}
                min={0}
                step={1}
                onChange={handleChangeTargetNicStrength}
                inputTestId="settingsTargetNicStrengthInput"
              />
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-description">
              <h2>Nicotine</h2>
              <p>The strength and carrier of your undiluted base.</p>
            </div>
            <div className="settings-controls">
              <label className="switch-row">
                <span>
                  <strong>Zero nicotine mode</strong>
                  <small>Hide nicotine controls for nicotine-free mixes.</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Zero nicotine mode"
                  checked={zeroNicotineMode}
                  onChange={(event) =>
                    setZeroNicotineMode(event.target.checked)
                  }
                />
                <span className="switch-track" aria-hidden="true" />
              </label>
              <NumberField
                label="Undiluted Strength"
                unit="mg/mL"
                value={nicConfig.strength}
                min={0}
                max={1000}
                step={5}
                onChange={handleChangeNicConfigStrength}
                inputTestId="settingsNicStrengthInput"
              />
              <RatioField
                label="Base"
                ariaLabel="Undiluted nicotine base"
                pg={nicConfig.pg}
                vg={nicConfig.vg}
                onChange={handleChangeNicConfigPgVg}
                pgTestId="settingsNicPgInput"
                vgTestId="settingsNicVgInput"
              />
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-description">
              <h2>Flavors</h2>
              <p>Defaults for each flavor you add.</p>
            </div>
            <div className="settings-controls">
              <RatioField
                label="Base"
                ariaLabel="Flavor base"
                pg={flavorConfig.pg}
                vg={flavorConfig.vg}
                onChange={handleChangeFlavorConfigPgVg}
                pgTestId="settingsFlavorPgInput"
                vgTestId="settingsFlavorVgInput"
              />
              <NumberField
                label="Flavor Percentage"
                unit="%"
                value={flavorConfig.percentage}
                min={0}
                max={100}
                step={0.5}
                onChange={handleChangeFlavorConfigPercentage}
                inputTestId="settingsFlavorPercentageInput"
              />
            </div>
          </section>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div className="form-actions">
            <button type="submit" className="primary" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
