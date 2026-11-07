"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import AuthProviders from "@/components/auth/AuthProviders";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/client-api";
import { validateEmail, validatePassword } from "@/lib/helpers";

interface SignupProps {
  onLogin?: () => void;
  onSuccess?: () => void;
}

export default function Signup({ onLogin, onSuccess }: SignupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Email is invalid.");
      return;
    }
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
      await api.post("/api/user", { email, password });
      await refresh();
      onSuccess?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to register new account.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1>Create an account</h1>
      <AuthProviders />
      {isLoading ? (
        <Spinner />
      ) : (
        <>
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
            <label>
              Password
              <input
                type="password"
                autoComplete="new-password"
                aria-label="Password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                aria-label="Confirm password"
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
              Create account
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </form>
          {onLogin && (
            <p className="auth-other">
              Already have an account?{" "}
              <button type="button" className="text-button" onClick={onLogin}>
                Sign in
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
