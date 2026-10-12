import { createContext } from "react";

export interface PatoUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface AuthContextValue {
  user: PatoUser | null;
  token: string | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
