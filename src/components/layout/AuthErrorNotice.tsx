"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const MESSAGES: Record<string, string> = {
  google: "Google sign-in failed. Please try again.",
  "google-email":
    "Your Google account did not share an email address, which is required to sign in.",
  "google-email-unverified":
    "Google has not verified that email address, so it cannot be used to sign in. Verify it with Google or sign up with email instead.",
  twitter: "Twitter sign-in failed. Please try again.",
  "twitter-email":
    "Your Twitter account did not share an email address, which is required to sign in. You may need to grant email access to ejuicr in your Twitter settings.",
  "twitter-conflict":
    "That email address is already connected to a different Twitter account. Sign in with the linked account or unlink it first.",
};

export default function AuthErrorNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const showToast = useToast();
  const shown = useRef<string | null>(null);

  const error = searchParams.get("authError");

  useEffect(() => {
    if (!error || shown.current === error) return;
    shown.current = error;

    showToast(MESSAGES[error] ?? "Sign-in failed. Please try again.", "error");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("authError");
    const query = params.toString();
    const hash = window.location.hash;
    router.replace(`${pathname}${query ? `?${query}` : ""}${hash}`, {
      scroll: false,
    });
  }, [error, pathname, router, searchParams, showToast]);

  return null;
}
