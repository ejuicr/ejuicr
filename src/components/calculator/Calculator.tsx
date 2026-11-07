"use client";

import { useEffect, useState } from "react";
import Ingredients from "./Ingredients";
import Results from "./Results";
import SaveRecipe from "./SaveRecipe";
import TargetEjuice from "./TargetEjuice";
import { useCalculator } from "./useCalculator";
import type { Recipe } from "@/types";

export default function Calculator({ recipe }: { recipe?: Recipe }) {
  const calculator = useCalculator(recipe);
  const [name, setName] = useState(recipe?.name);

  // A saved recipe's tab title is its current name (" - ejuicr" matching the
  // site title); the plain calculator keeps the root title.
  useEffect(() => {
    if (!recipe) return;
    document.title = `${name} - ejuicr`;
    return () => {
      document.title = "ejuicr";
    };
  }, [recipe, name]);

  return (
    <>
      {recipe ? (
        <h1 className="recipe-heading">{name}</h1>
      ) : (
        <h1 className="sr-only">Ejuice calculator</h1>
      )}
      <div className="calculator-layout workbench">
        <div className="inputs-zone">
          <TargetEjuice calculator={calculator} />
          <Ingredients calculator={calculator} />
        </div>
        <div className="results-zone">
          <Results calculator={calculator} />
        </div>
        <SaveRecipe
          calculator={calculator}
          recipe={recipe}
          onRenamed={setName}
        />
      </div>
    </>
  );
}
