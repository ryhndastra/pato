import { useEffect, useRef, type RefObject } from "react";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function loadScript(): Promise<void> {
  if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat skrip Google"));
    document.head.appendChild(script);
  });
}

/**
 * Renders Google's own "Sign in with Google" button into `containerRef`.
 *
 * Earlier version used `google.accounts.id.prompt()` on a custom-styled
 * button - looked right, but modern Chrome requires FedCM for that path
 * and silently no-ops without it ("nothing happened" when clicked). The
 * official rendered button doesn't have that problem, so we use it and
 * just size/theme it to sit close to our design instead.
 */
export function useGoogleButton(
  containerRef: RefObject<HTMLDivElement | null>,
  onCredential: (idToken: string) => void,
  text: "signin_with" | "signup_with" | "continue_with" = "continue_with",
): boolean {
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID || !containerRef.current) return;
    let cancelled = false;
    const container = containerRef.current;

    loadScript()
      .then(() => {
        if (cancelled) return;
        window.google?.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbackRef.current(response.credential),
        });
        window.google?.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "left",
          text,
          width: String(Math.min(container.offsetWidth || 360, 400)),
        });
      })
      .catch((err: unknown) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [containerRef, text]);

  return Boolean(CLIENT_ID);
}
