import { useEffect, useRef, type RefObject } from "react";

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/**
 * Module-level singleton promise. Previously this checked for the <script>
 * tag's existence and resolved immediately if found - but in React 18
 * StrictMode (dev) the effect mounts, cleans up, then mounts again before
 * the first script.onload ever fires. The second mount saw the tag already
 * in the DOM and resolved right away, calling google.accounts.id before the
 * SDK had actually loaded, so the button silently never rendered until
 * something else (like a prop change) re-ran the effect.
 */
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Gagal memuat skrip Google")),
        );
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Gagal memuat skrip Google"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
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
  shape: "rectangular" | "pill" = "pill",
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
          shape,
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
  }, [containerRef, text, shape]);

  return Boolean(CLIENT_ID);
}
