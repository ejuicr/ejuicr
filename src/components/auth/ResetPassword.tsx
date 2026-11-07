"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/client-api";
import Spinner from "@/components/ui/Spinner";

export default function ResetPassword({
  onSignIn,
}: {
  onSignIn?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccess("");
    setError("");
    setIsLoading(true);

    try {
      // ADR-007: the response is generic, whether or not the account exists.
      await api.post("/api/user/reset-password", { email });
      setSuccess("Check your email inbox for a link to change your password.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to process the request.  Try again or contact support.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  if (success) {
    return (
      <>
        <h1>Check your email</h1>
        <div className="message success" role="status">
          {success}
        </div>
        {onSignIn && (
          <button type="button" className="primary" onClick={onSignIn}>
            Return to sign in
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <h1>Reset password</h1>
      <p className="auth-intro">
        Enter your email address to request a password reset link.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            aria-label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="primary">
          Send reset link
        </button>
      </form>
      {onSignIn && (
        <button
          type="button"
          className="text-button auth-return"
          onClick={onSignIn}
        >
          Return to sign in
        </button>
      )}
    </>
  );
}
