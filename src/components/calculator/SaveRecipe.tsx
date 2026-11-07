"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { useAuthDialog } from "@/components/auth/AuthDialogContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client-api";
import type { Recipe } from "@/types";
import {
  CALCULATOR_STORAGE_KEY,
  type CalculatorController,
} from "./useCalculator";

export default function SaveRecipe({
  calculator,
  recipe,
  onRenamed,
}: {
  calculator: CalculatorController;
  recipe?: Recipe;
  onRenamed?: (name: string) => void;
}) {
  const { user } = useAuth();
  const { openAuth } = useAuthDialog();
  const showToast = useToast();
  const [recipeTitle, setRecipeTitle] = useState(recipe?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    targetPg,
    targetVg,
    targetNicStrength,
    targetAmount,
    nicConfig,
    flavors,
  } = calculator;

  const handleClickSaveRecipe = async () => {
    setError("");
    setIsLoading(true);

    if (!recipeTitle.trim()) {
      setError("Recipe title must not be blank.");
      setIsLoading(false);
      return;
    }

    const newRecipe = {
      name: recipeTitle.trim(),
      strength: targetNicStrength,
      base: {
        pg: targetPg,
        vg: targetVg,
      },
      amount: targetAmount,
      ingredients: {
        nicotine: {
          strength: nicConfig.strength,
          base: {
            pg: nicConfig.pg,
            vg: nicConfig.vg,
          },
        },
        flavors: flavors.map((flavor) => ({
          name: flavor.name,
          percentage: flavor.percentage,
          base: {
            pg: flavor.pg,
            vg: flavor.vg,
          },
        })),
      },
    };

    try {
      if (!recipe) {
        const created = await api.post<Recipe>("/api/recipes", newRecipe);
        showToast(`"${created.name}" has been saved to your recipes.`);
        localStorage.removeItem(CALCULATOR_STORAGE_KEY);
      } else {
        const updated = await api.put<Recipe>(
          `/api/recipes/${recipe._id}`,
          newRecipe,
        );
        showToast(`"${updated.name}" has been updated.`);
        onRenamed?.(updated.name);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : recipe
            ? "Failed to update recipe."
            : "Failed to save recipe.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      openAuth();
      return;
    }
    void handleClickSaveRecipe();
  };

  return (
    <section className="panel save-block">
      <div className="section-label">
        <h2>{recipe ? "Save Changes" : "Save Recipe"}</h2>
      </div>
      {error && (
        <div className="message error" role="alert">
          {error}
        </div>
      )}
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <form className="save-row" onSubmit={handleSubmit}>
            <label>
              <span className="sr-only">Recipe name</span>
              <input
                type="text"
                aria-label="Recipe name"
                placeholder="Name your recipe"
                value={recipeTitle}
                maxLength={60}
                onChange={(event) => setRecipeTitle(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="primary"
              disabled={Boolean(calculator.error)}
              title={calculator.error || undefined}
            >
              Save
            </button>
          </form>
          {!user && (
            <p className="save-hint">
              Sign in to save this recipe. Your inputs stay here.
            </p>
          )}
        </>
      )}
    </section>
  );
}
