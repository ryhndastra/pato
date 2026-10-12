import type { FormEvent } from "react";

export type AuthMode = "login" | "register";

export interface AuthViewProps {
  isRegister: boolean;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  submitting: boolean;
  setMode: (m: AuthMode) => void;
  handleSubmit: (e: FormEvent) => void;
  handleGoogleSuccess: (idToken: string) => Promise<void>;
  onBack: () => void;
}

