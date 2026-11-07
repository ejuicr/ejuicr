"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/providers/AuthProvider";
import UserProfile from "@/components/account/UserProfile";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/client-api";
import { validatePassword } from "@/lib/helpers";
import type { PublicUser } from "@/types";

type LinkedProvider = "google" | "twitter";

const PROVIDER_LABELS: Record<LinkedProvider, string> = {
  google: "Google",
  twitter: "X / Twitter",
};

const SHARED_DATA: Record<LinkedProvider, string> = {
  google: "Display name, email, profile picture.",
  twitter: "Handle, display name, email, profile picture.",
};

export default function MyAccount() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [recipes, setRecipes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isLoadingChangePassword, setIsLoadingChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteDialogue, setShowDeleteDialogue] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<LinkedProvider | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get<PublicUser>("/api/user/me"),
      api.get<{ count: number }>("/api/recipes?count=1"),
    ])
      .then(([me, countData]) => {
        if (cancelled) return;
        setUser(me);
        setRecipes(countData.count ?? 0);
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load account data.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setUser]);

  if (!user) return null;

  const numberOfLinkedAccounts =
    (user.hasGoogleLinked ? 1 : 0) + (user.hasTwitterLinked ? 1 : 0);
  const canUnlink = user.hasPassword || numberOfLinkedAccounts > 1;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (caughtError) {
      // Local state is already cleared; still leave the account UI.
      console.error(caughtError);
    }
    router.push("/");
    router.refresh();
    showToast("Signed out. Your calculator inputs are still here.");
  };

  const onSubmitSetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(newPassword);
    if (passwordError !== true) {
      setError(passwordError);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoadingChangePassword(true);
    try {
      await api.post("/api/user/set-password", { password: newPassword });
      setUser({ ...user, hasPassword: true });
      setNewPassword("");
      setNewPasswordConfirm("");
      showToast("Your password has been set.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to set the password.  Try again or contact support.",
      );
    } finally {
      setIsLoadingChangePassword(false);
    }
  };

  const onSubmitChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(newPassword);
    if (passwordError !== true) {
      setError(passwordError);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoadingChangePassword(true);
    try {
      await api.post("/api/user/change-password", { password, newPassword });
      setPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      showToast("Your password has been changed.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to change the password.  Try again or contact support.",
      );
    } finally {
      setIsLoadingChangePassword(false);
    }
  };

  const handleConfirmRemoveLinkedAccount = async (
    provider: LinkedProvider,
  ) => {
    setError("");
    try {
      await api.delete(`/api/user/${provider}`);
      const me = await api.get<PublicUser>("/api/user/me");
      setUser(me);
      showToast(`${PROVIDER_LABELS[provider]} account unlinked.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to remove linked account.",
      );
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete("/api/user");
      setUser(null);
      showToast("Your account has been deleted.");
      router.push("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete account.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="account-loading">
        <Spinner />
      </div>
    );
  }

  const linkedProviders: LinkedProvider[] = [
    ...(user.hasGoogleLinked ? (["google"] as const) : []),
    ...(user.hasTwitterLinked ? (["twitter"] as const) : []),
  ];

  return (
    <>
      <div className="account-view">
        <h1 className="sr-only">My account</h1>
        <section className="panel account-profile">
          <div className="section-label">
            <h2>My account</h2>
            <FontAwesomeIcon icon={faUser} />
          </div>
          <UserProfile user={user} />
          <Link href="/recipes" className="account-recipes">
            {recipes} saved {recipes === 1 ? "recipe" : "recipes"}
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
          <button
            type="button"
            className="signout-button"
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            Sign out
          </button>
        </section>

        <div className="account-details">
          {error && (
            <div className="message error" role="alert">
              {error}
            </div>
          )}

          {linkedProviders.length > 0 && (
            <section className="panel">
              <div className="section-label">
                <h2>Linked accounts</h2>
              </div>
              {linkedProviders.map((provider) => (
                <div className="provider-row" key={provider}>
                  <Image
                    src={
                      provider === "google"
                        ? "/google-logo.svg"
                        : "/x-logo.svg"
                    }
                    alt=""
                    width={22}
                    height={22}
                  />
                  <div>
                    <strong>{PROVIDER_LABELS[provider]}</strong>
                    <p>{SHARED_DATA[provider]}</p>
                  </div>
                  <button
                    type="button"
                    className="danger-outline"
                    onClick={() => setAccountToUnlink(provider)}
                  >
                    Unlink
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="panel">
            <div className="section-label">
              <h2>{user.hasPassword ? "Change Password" : "Set Password"}</h2>
            </div>
            {isLoadingChangePassword ? (
              <Spinner />
            ) : user.hasPassword ? (
              <form className="password-form" onSubmit={onSubmitChangePassword}>
                <label>
                  Current password
                  <input
                    type="password"
                    autoComplete="current-password"
                    aria-label="Current password"
                    placeholder="Current Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="New password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="Confirm new password"
                    placeholder="Confirm New Password"
                    value={newPasswordConfirm}
                    onChange={(event) =>
                      setNewPasswordConfirm(event.target.value)
                    }
                  />
                </label>
                <p className="field-note">At least 6 characters.</p>
                <button type="submit" className="primary">
                  Change Password
                </button>
              </form>
            ) : (
              <form className="password-form" onSubmit={onSubmitSetPassword}>
                <label>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="New password"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="Confirm new password"
                    placeholder="Confirm Password"
                    value={newPasswordConfirm}
                    onChange={(event) =>
                      setNewPasswordConfirm(event.target.value)
                    }
                  />
                </label>
                <p className="field-note">At least 6 characters.</p>
                <button type="submit" className="primary">
                  Set Password
                </button>
              </form>
            )}
          </section>

          <section className="panel delete-section">
            <div className="section-label">
              <h2>Delete Account</h2>
            </div>
            <p>
              Permanently delete your account, personal data, saved recipes and
              settings. This cannot be undone.
            </p>
            <button
              type="button"
              className="danger-outline"
              onClick={() => setShowDeleteDialogue(true)}
            >
              Delete Account
            </button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={accountToUnlink !== null}
        title={
          canUnlink
            ? `Unlink ${accountToUnlink ? PROVIDER_LABELS[accountToUnlink] : ""}?`
            : "Set a password first"
        }
        confirmLabel="Unlink"
        onClose={() => setAccountToUnlink(null)}
        onConfirm={canUnlink ? () => {
          const provider = accountToUnlink;
          setAccountToUnlink(null);
          if (provider && canUnlink) {
            void handleConfirmRemoveLinkedAccount(provider);
          }
        } : undefined}
      >
        {canUnlink ? (
          <p>
            You will no longer be able to sign in with this linked account.
          </p>
        ) : (
          <>
            <p>
              This is your only sign-in method. Set a password before unlinking
              this account.
            </p>
            <p>You can set a password from the My Account page.</p>
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={showDeleteDialogue}
        title="Delete your account?"
        confirmLabel="Delete Account"
        onClose={() => setShowDeleteDialogue(false)}
        onConfirm={() => {
          setShowDeleteDialogue(false);
          void handleConfirmDelete();
        }}
      >
        <p>Your login credentials, profile information, recipes and settings will
          be permanently deleted. This cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
}
