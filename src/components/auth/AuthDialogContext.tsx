"use client";

import { createContext, useContext } from "react";

interface AuthDialogContextValue {
  openAuth: () => void;
}

export const AuthDialogContext = createContext<AuthDialogContextValue>({
  openAuth: () => {},
});

export function useAuthDialog(): AuthDialogContextValue {
  return useContext(AuthDialogContext);
}
