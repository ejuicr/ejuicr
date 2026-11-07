"use client";

import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";

/** Configured OAuth links, shown above the email form on sign-in and signup. */
export default function AuthProviders() {
  const { providers } = useAuth();

  if (!providers.google && !providers.twitter) return null;

  return (
    <>
      <div className="provider-buttons">
        {providers.google && (
          <a href="/api/auth/google" className="provider-button">
            <Image
              src="/google-logo.svg"
              alt=""
              width={19}
              height={19}
              className="h-auto"
            />
            Continue with Google
          </a>
        )}
        {providers.twitter && (
          <a href="/api/auth/twitter" className="provider-button">
            <Image
              src="/x-logo.svg"
              alt=""
              width={18}
              height={18}
              className="h-auto"
            />
            Continue with X
          </a>
        )}
      </div>
      <div className="or-divider">
        <span>or with email</span>
      </div>
    </>
  );
}
