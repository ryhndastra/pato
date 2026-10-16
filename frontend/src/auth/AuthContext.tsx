import { useState, type ReactNode } from "react";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { AuthContext, type PatoUser, type UpdateProfileParams } from "./authContext";

const TOKEN_KEY = "pato_token";
const USER_KEY = "pato_user";

interface SessionResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    has_password?: boolean;
  };
}

function toPatoUser(raw: SessionResponse["user"]): PatoUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    avatarUrl: raw.avatar_url,
    hasPassword: raw.has_password,
  };
}

function readStoredUser(): PatoUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as PatoUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function readStoredToken(): string | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    if (stored.startsWith('"') && stored.endsWith('"')) {
      return JSON.parse(stored) as string;
    }
    return stored;
  } catch {
    return localStorage.getItem(TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<PatoUser | null>(() => readStoredUser());

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

  async function updateProfile(params: UpdateProfileParams): Promise<PatoUser> {
    if (!token) throw new Error("Kamu harus login terlebih dahulu.");
    const res = await apiPatch<{ user: SessionResponse["user"] }>(
      "/api/auth/profile",
      {
        name: params.name,
        avatar_url: params.avatarUrl,
        current_password: params.currentPassword,
        new_password: params.newPassword,
      },
      token,
    );
    const nextUser = toPatoUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  async function refreshUser(): Promise<PatoUser | null> {
    if (!token) return null;
    try {
      const res = await apiGet<{ user: SessionResponse["user"] }>("/api/auth/me", token);
      const nextUser = toPatoUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return nextUser;
    } catch {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        updateProfile,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
