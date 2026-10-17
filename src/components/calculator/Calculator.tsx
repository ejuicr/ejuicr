"use client";

import { useEffect, useState } from "react";
import Ingredients from "./Ingredients";
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
      <div>
        {recipe ? (
          <div className="recipe-header">
            <h1 className="text-center">{name}</h1>
            <hr className="mb-8" />
          </div>
        ) : (
          <h1 className="sr-only">ejuicr calculator</h1>
        )}
        <TargetEjuice calculator={calculator} />
        <Ingredients calculator={calculator} />
      </div>
      <SaveRecipe
        calculator={calculator}
        recipe={recipe}
        onRenamed={setName}
      />
    </>
  );
}
