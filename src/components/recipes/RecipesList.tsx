"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBookOpen,
  faChevronRight,
  faFlask,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconButton from "@/components/ui/IconButton";
import { ErrorMessage } from "@/components/ui/Messages";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client-api";
import type { RecipeSummary } from "@/types";

type SortOrder = "date" | "title";

function updatedTime(updatedAt?: string): number {
  if (!updatedAt) return 0;
  const time = new Date(updatedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatUpdatedDate(updatedAt?: string): string | null {
  if (!updatedAt) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RecipesList() {
  const showToast = useToast();
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOrder>("date");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<RecipeSummary | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    api
      .get<RecipeSummary[]>("/api/recipes")
      .then((data) => {
        if (cancelled) return;
        setRecipes(data);
        setError("");
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load recipes.",
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

  const sortedRecipes = useMemo(() => {
    return [...(recipes ?? [])].sort((a, b) =>
      sort === "title"
        ? a.name.localeCompare(b.name)
        : updatedTime(b.updatedAt) - updatedTime(a.updatedAt),
    );
  }, [recipes, sort]);

  const handleRetry = () => {
    setError("");
    setIsLoading(true);
    setRequestId((current) => current + 1);
  };

  const handleDelete = async (recipe: RecipeSummary) => {
    setError("");
    try {
      await api.delete(`/api/recipes/${recipe._id}`);
      setRecipes(
        (current) =>
          current?.filter((item) => item._id !== recipe._id) ?? null,
      );
      showToast("Recipe deleted.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete recipe.",
      );
    }
  };

  const hasRecipes = (recipes?.length ?? 0) > 0;

  return (
    <section className="panel recipe-list-panel">
      <div className="section-label">
        <h1>Saved recipes</h1>
        {!isLoading && hasRecipes && (
          <label className="sort-control">
            <span>Sort by</span>
            <select
              aria-label="Sort recipes"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
            >
              <option value="date">Last updated</option>
              <option value="title">Title</option>
            </select>
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="list-state" role="status">
          <span className="loading-dot" aria-hidden="true" />
          Loading recipes…
        </div>
      ) : error && !hasRecipes ? (
        <div className="list-state">
          <ErrorMessage>{error}</ErrorMessage>
          <button type="button" className="primary" onClick={handleRetry}>
            Try again
          </button>
        </div>
      ) : !hasRecipes ? (
        <div className="list-state">
          <FontAwesomeIcon icon={faBookOpen} />
          <h2>No saved recipes</h2>
          <p>Save a recipe from the calculator to find it here.</p>
          <Link href="/" className="primary workspace-action">
            Open calculator
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      ) : (
        <>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <ul className="recipe-list">
            {sortedRecipes.map((recipe) => {
              const updated = formatUpdatedDate(recipe.updatedAt);
              return (
                <li key={recipe._id}>
                  <Link
                    href={`/recipes/${recipe._id}`}
                    className="recipe-open"
                  >
                    <span className="recipe-mark">
                      <FontAwesomeIcon icon={faFlask} />
                    </span>
                    <span className="recipe-title">{recipe.name}</span>
                    {updated && (
                      <time dateTime={recipe.updatedAt}>
                        Updated {updated}
                      </time>
                    )}
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Link>
                  <IconButton
                    label={`Delete ${recipe.name}`}
                    testId={`deleteRecipe-${recipe._id}`}
                    danger
                    onClick={() => setPendingDelete(recipe)}
                  >
                    <FontAwesomeIcon icon={faTrashCan} />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          open
          title={`Delete “${pendingDelete.name}”?`}
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete;
            setPendingDelete(null);
            void handleDelete(target);
          }}
        >
          <p>This recipe will be permanently removed from your saved recipes.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
