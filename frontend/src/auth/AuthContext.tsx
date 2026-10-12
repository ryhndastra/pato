import { useState, type ReactNode } from "react";
import { apiPost } from "../lib/api";
import { AuthContext, type PatoUser } from "./authContext";

const TOKEN_KEY = "pato_token";
const USER_KEY = "pato_user";

interface SessionResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

function toPatoUser(raw: SessionResponse["user"]): PatoUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
  };
}

function readStored<T>(key: string): T | null {
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStored(TOKEN_KEY));
  const [user, setUser] = useState<PatoUser | null>(() => readStored(USER_KEY));

  function persistSession(session: SessionResponse) {
    const nextUser = toPatoUser(session.user);
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(session.token);
    setUser(nextUser);
  }

  async function loginWithEmail(email: string, password: string) {
    const session = await apiPost<SessionResponse>("/api/auth/login", {
      email,
      password,
    });
    persistSession(session);
  }

  async function registerWithEmail(name: string, email: string, password: string) {
    const session = await apiPost<SessionResponse>("/api/auth/register", {
      name,
      email,
      password,
    });
    persistSession(session);
  }

  async function loginWithGoogle(idToken: string) {
    const session = await apiPost<SessionResponse>("/api/auth/google", {
      id_token: idToken,
    });
    persistSession(session);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
