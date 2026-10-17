import { useEffect, useState } from "react";
import patoMascot from "../assets/pato.png";

interface SplashScreenProps {
  onFinish?: () => void;
  /** Duration in ms before starting smooth fade-out exit (default: 1500ms) */
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger smooth fade-out exit
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, minDuration);

    // Complete exit and unmount from DOM
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, minDuration + 320);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  function handleSkip() {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onFinish?.();
    }, 250);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#1d4ed8] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white select-none transition-opacity duration-300 ease-out cursor-pointer ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Ambient static background glow orbs (strictly static, no pulsing to prevent flickering) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Subtle background radial dots */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Centerpiece Content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Logo Card */}
        <div className="relative flex items-center justify-center animate-splash-entry">
          {/* Soft static glow behind logo */}
          <div className="absolute h-32 w-32 rounded-full bg-white/15 blur-lg pointer-events-none" />

          {/* Clean White Squircle Badge */}
          <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-[32px] border-4 border-white/90 bg-white shadow-[0_20px_45px_rgba(26,54,138,0.35)]">
            <img
              src={patoMascot}
              alt="PaTo"
              className="h-20 w-20 sm:h-22 sm:w-22 object-contain"
            />
          </div>
        </div>

        {/* Text Container (Animated via pure CSS delay, no React re-render flicker) */}
        <div className="mt-6 flex flex-col items-center text-center animate-splash-fade-up">
          {/* Brand Name */}
          <div className="flex items-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm font-sans">
              PaTo
            </span>
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
          </div>

          {/* Subtitle / Pill */}
          <div className="mt-1.5 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-blue-100 backdrop-blur-md ring-1 ring-white/20">
            <span>Pay Together</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200">Split Bill Pintar</span>
          </div>

          <p className="mt-2 text-xs font-medium text-white/80 tracking-wide max-w-[240px]">
            Bagi tagihan makan bareng tanpa drama & hitungan ribet
          </p>

          {/* Sleek Progress Indicator */}
          <div className="mt-6 w-32 h-1 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
            <div className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-splash-progress" />
          </div>
        </div>
      </div>

      {/* Subtle Bottom Footer */}
      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-center pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 font-mono">
          PaTo App
        </span>
        <span className="text-[9px] text-white/30">Ketuk layar untuk langsung masuk</span>
      </div>
    </div>
  );
}
