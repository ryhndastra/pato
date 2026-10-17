import { useCallback, useEffect, useRef, useState } from "react";
import { soundFX } from "../lib/soundFx";
import { haptic } from "../lib/haptic";

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        soundFX.playTap();
        haptic.medium();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
      });
    },
    [resetMs],
  );

  return { copied, copy };
}
