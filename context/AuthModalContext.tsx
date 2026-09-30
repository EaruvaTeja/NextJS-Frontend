// context/AuthModalContext.tsx
//
// Global state for the auth modal (login / register popup).
//
// Pattern mirrors AuthContext:
//   - createContext
//   - AuthModalProvider component
//   - useAuthModal hook reads via useContext

"use client";

import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

// Which tab is shown in the modal
export type AuthModalView = "login" | "register";

interface AuthModalContextValue {
  isOpen: boolean;
  view: AuthModalView;
  open: (view?: AuthModalView) => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
}

export const AuthModalContext = createContext<
  AuthModalContextValue | undefined
>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setViewState] = useState<AuthModalView>("login");

  const open = useCallback((initialView: AuthModalView = "login") => {
    setViewState(initialView);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setView = useCallback((newView: AuthModalView) => {
    setViewState(newView);
  }, []);

  const value: AuthModalContextValue = {
    isOpen,
    view,
    open,
    close,
    setView,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
}