"use client";

import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { config } from "@fortawesome/fontawesome-svg-core";
import AuthDrawer from "./AuthDrawer";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import AuthErrorNotice from "./AuthErrorNotice";
import { AuthDialogContext } from "@/components/auth/AuthDialogContext";
import ToastProvider from "@/components/ui/Toast";

// The root layout imports the same stylesheet, so keep client renders from
// appending a second copy to <head> after hydration.
config.autoAddCss = false;

export default function AppShell({ children }: { children: ReactNode }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const openAuth = useCallback(() => setIsAuthOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthOpen(false), []);
  const authDialog = useMemo(() => ({ openAuth }), [openAuth]);

  return (
    <ToastProvider>
      <AuthDialogContext.Provider value={authDialog}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="app-shell">
          <Sidebar />
          <div className="main-column">
          <main id="main" tabIndex={-1}>
            <Suspense fallback={null}>
              <AuthErrorNotice />
            </Suspense>
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <AuthDrawer open={isAuthOpen} onClose={closeAuth} />
      </AuthDialogContext.Provider>
    </ToastProvider>
  );
}
