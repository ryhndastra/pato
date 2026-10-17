import { createContext } from "react";

export interface PatoUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  hasPassword?: boolean;
  defaultBankName?: string | null;
  defaultBankAccountNo?: string | null;
  defaultBankAccountName?: string | null;
  defaultRoundMode?: "none" | "hundred" | "thousand" | string | null;
}

export interface UpdateProfileParams {
  name?: string;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
  defaultBankName?: string | null;
  defaultBankAccountNo?: string | null;
  defaultBankAccountName?: string | null;
  defaultRoundMode?: "none" | "hundred" | "thousand" | string;
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
  updateProfile: (params: UpdateProfileParams) => Promise<PatoUser>;
  refreshUser: () => Promise<PatoUser | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

