"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ResetPassword from "@/components/auth/ResetPassword";
import { useAuthDialog } from "@/components/auth/AuthDialogContext";
import Spinner from "@/components/ui/Spinner";
import { ApiClientError, api } from "@/lib/client-api";
import { validatePassword } from "@/lib/helpers";

const INVALID_TOKEN_MESSAGE =
  "This reset link is invalid, expired or has already been used.";

export default function UpdatePasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expired, setExpired] = useState(false);
  const [showResetRequest, setShowResetRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { openAuth } = useAuthDialog();

  const goToSignIn = () => {
    router.push("/");
    openAuth();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccess("");
    setError("");

    const passwordError = validatePassword(password);
    if (passwordError !== true) {
      setError(passwordError);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/user/reset-password/${token}`, { password });
      setSuccess(
        "Your password has been changed. You can now log in with the new password.",
      );
    } catch (caughtError) {
      const invalidToken =
        caughtError instanceof ApiClientError &&
        caughtError.status === 400 &&
        /token|reset link|expired|already been used/i.test(
          caughtError.message,
        );
      if (invalidToken) {
        setExpired(true);
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to set new password.  Try again or contact support.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="panel auth-panel">
        {showResetRequest ? (
          <ResetPassword onSignIn={goToSignIn} />
        ) : success ? (
          <>
            <h1>Password changed</h1>
            <div className="message success" role="status">
              {success}
            </div>
            <button
              type="button"
              className="primary"
              onClick={goToSignIn}
            >
              Sign in
            </button>
          </>
        ) : expired ? (
          <>
            <h1>Reset link expired</h1>
            <div className="message error" role="alert">
              {INVALID_TOKEN_MESSAGE}
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => setShowResetRequest(true)}
            >
              Request a new link
            </button>
            <button
              type="button"
              className="text-button auth-return"
              onClick={goToSignIn}
            >
              Return to sign in
            </button>
          </>
        ) : (
          <>
            <h1>New password</h1>
            {isLoading ? (
              <Spinner />
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="New password"
                    placeholder="New Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    aria-label="Confirm new password"
                    placeholder="Confirm Password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                  />
                </label>
                <p className="field-note">
                  At least 6 characters. Passwords are limited to 72 bytes.
                </p>
                {error && (
                  <div className="message error" role="alert">
                    {error}
                  </div>
                )}
                <button type="submit" className="primary">
                  Update password
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
