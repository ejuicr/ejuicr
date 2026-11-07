"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import AuthProviders from "@/components/auth/AuthProviders";
import { useAuth } from "@/components/providers/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/client-api";
import { validateEmail } from "@/lib/helpers";

interface LoginProps {
  onSignup?: () => void;
  onResetPassword?: () => void;
  onSuccess?: () => void;
}

export default function Login({
  onSignup,
  onResetPassword,
  onSuccess,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Email is invalid.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/user/login", { email, password });
      await refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to log in.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1>Sign in</h1>
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
                autoComplete="current-password"
                aria-label="Password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {onResetPassword && (
              <button
                type="button"
                className="text-button forgot"
                onClick={onResetPassword}
              >
                Forgot password?
              </button>
            )}
            {error && (
              <div className="message error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="primary">
              Sign in
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </form>
          {onSignup && (
            <p className="auth-other">
              Need an account?{" "}
              <button type="button" className="text-button" onClick={onSignup}>
                Sign up
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
