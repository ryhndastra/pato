import { useRef } from "react";
import { useGoogleButton } from "../../auth/useGoogleButton";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  isRegister: boolean;
  themeOnDark?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  isRegister,
  themeOnDark = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isConfigured = useGoogleButton(
    containerRef,
    onSuccess,
    isRegister ? "signup_with" : "continue_with",
    "pill",
  );

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-center">
        <div
          ref={containerRef}
          className="flex min-h-[44px] w-full justify-center [&_iframe]:!rounded-full"
        />
      </div>
      {!isConfigured && (
        <p
          className={`mt-2 text-center text-[11px] ${
            themeOnDark ? "text-white/60" : "text-ink-muted"
          }`}
        >
          (Login Google otomatis aktif saat client ID terpasang)
        </p>
      )}
    </div>
  );
}

