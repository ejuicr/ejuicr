"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import Login from "@/components/auth/Login";
import Signup from "@/components/auth/Signup";
import ResetPassword from "@/components/auth/ResetPassword";
import IconButton from "@/components/ui/IconButton";
import { useFocusTrap } from "@/components/ui/useFocusTrap";
import { useToast } from "@/components/ui/Toast";

type View = "login" | "signup" | "reset";

export default function AuthDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("login");
  const router = useRouter();
  const showToast = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setView("login");
    onClose();
  }, [onClose]);

  const handleSuccess = useCallback(() => {
    showToast(view === "signup" ? "Account created." : "Signed in.");
    handleClose();
    router.refresh();
  }, [handleClose, router, showToast, view]);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={handleClose}
        className={clsx("auth-backdrop", open ? "open" : "closed")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Sign in"
        aria-hidden={!open}
        inert={!open}
        tabIndex={-1}
        className={clsx("auth-drawer", open ? "open" : "closed")}
      >
        <div className="auth-drawer-head">
          <IconButton
            label="Close sign in"
            onClick={handleClose}
            className="auth-close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        </div>

        {open && (view === "login" ? (
          <Login
            onSignup={() => setView("signup")}
            onResetPassword={() => setView("reset")}
            onSuccess={handleSuccess}
          />
        ) : view === "signup" ? (
          <Signup
            onLogin={() => setView("login")}
            onSuccess={handleSuccess}
          />
        ) : (
          <ResetPassword
            onSignIn={() => setView("login")}
          />
        ))}
      </div>
    </>
  );
}
