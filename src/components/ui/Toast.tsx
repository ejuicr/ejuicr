"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";
type ShowToast = (text: string, type?: ToastType) => void;

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

/** Transient status messages, styled after the Astra prototype toast. */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback<ShowToast>((text, type = "success") => {
    setToast({ id: ++nextId.current, text, type });
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        id="toast-root"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <svg
              className="toast-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d={
                  toast.type === "success"
                    ? "m5 13 4 4L19 7"
                    : "M12 3 2.5 20h19zM12 9v5M12 17h.01"
                }
              />
            </svg>
            <span>{toast.text}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
