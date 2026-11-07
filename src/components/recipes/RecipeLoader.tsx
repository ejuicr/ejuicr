"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Calculator from "@/components/calculator/Calculator";
import { ErrorMessage } from "@/components/ui/Messages";
import { api } from "@/lib/client-api";
import type { Recipe } from "@/types";

function isMissingRecipe(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 404
  );
}

/**
 * Loads a recipe. The request state is remounted when the ID changes so a
 * previous recipe or error can never linger while another one loads.
 */
export default function RecipeLoader({ id }: { id: string }) {
  return <RecipeRequest key={id} id={id} />;
}

function RecipeRequest({ id }: { id: string }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get<Recipe>(`/api/recipes/${id}`)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setMissing(true);
          return;
        }
        setRecipe(data);
      })
      .catch((caughtError) => {
        if (cancelled) return;
        if (isMissingRecipe(caughtError)) {
          setMissing(true);
          return;
        }
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load recipe.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const handleRetry = () => {
    setError("");
    setMissing(false);
    setIsLoading(true);
    setAttempt((current) => current + 1);
  };

  if (isLoading) {
    return (
      <div className="list-state panel" role="status">
        <span className="loading-dot" aria-hidden="true" />
        Loading recipe…
      </div>
    );
  }

  if (missing) {
    return (
      <article className="information panel">
        <h1>Recipe not found</h1>
        <p>This recipe is unavailable or has been deleted.</p>
        <Link href="/recipes" className="primary workspace-action">
          Return to saved recipes
        </Link>
        <p>
          If you still need help, <Link href="/help">contact support</Link>.
        </p>
      </article>
    );
  }

  if (error || !recipe) {
    return (
      <article className="information panel">
        <h1>Recipe could not be loaded</h1>
        <ErrorMessage>{error || "Failed to load recipe."}</ErrorMessage>
        <button type="button" className="primary" onClick={handleRetry}>
          Try again
        </button>
        <p>
          <Link href="/recipes">Return to saved recipes</Link>
        </p>
      </article>
    );
  }

  return <Calculator key={recipe._id} recipe={recipe} />;
}
