import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../auth/useAuth";
import { ApiError } from "../../lib/api";
import { DesktopLogin } from "./DesktopLogin";
import { MobileLogin } from "./MobileLogin";
import type { AuthMode } from "./types";
import { useIsDesktop } from "./useIsDesktop";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const isDesktop = useIsDesktop();

  const initialMode =
    searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [name, setName] = useState(searchParams.get("host") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  function goAfterLogin() {
    const eventParam = searchParams.get("event");
    if (eventParam) {
      navigate(`/create?event=${encodeURIComponent(eventParam)}`, {
        replace: true,
      });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  function errorMessage(err: unknown) {
    return err instanceof ApiError
      ? err.message
      : "Gagal terhubung ke server. Coba periksa koneksi internet.";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error("Nama lengkap wajib diisi.");
        }
        await registerWithEmail(name.trim(), email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
      goAfterLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(idToken);
      goAfterLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const commonProps = {
    isRegister,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    setError,
    submitting,
    setMode,
    handleSubmit,
    handleGoogleSuccess,
    onBack: () => navigate("/"),
  };

  return isDesktop ? (
    <DesktopLogin {...commonProps} />
  ) : (
    <MobileLogin {...commonProps} />
  );
}
export default Login;
