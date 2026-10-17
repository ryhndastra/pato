import { useEffect, useState } from "react";
import patoLogo from "../assets/pato.png";

interface SplashScreenProps {
  onFinish?: () => void;
  /** Duration in ms before initiating smooth fade-out exit (default: 1850ms) */
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 1850 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Initiate smooth fade-out exit after animations complete
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, minDuration);

    // Complete exit and unmount from DOM
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, minDuration + 350);

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
    }, 280);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#1d4ed8] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white select-none transition-all duration-350 ease-out cursor-pointer ${
        isExiting
          ? "opacity-0 scale-[1.03] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />

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
        {/* Pulsing Ripple Energy Rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full border border-white/25 animate-splash-ring-1 pointer-events-none" />
          <div className="absolute h-36 w-36 rounded-full border border-blue-200/35 animate-splash-ring-2 pointer-events-none" />

          {/* Soft Glow Disc */}
          <div className="absolute h-32 w-32 rounded-full bg-white/20 blur-xl pointer-events-none" />

          {/* Animated Logo Card */}
          <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-[36px] border-4 border-white/95 bg-white shadow-[0_24px_50px_rgba(26,54,138,0.45)] animate-splash-pop">
            <div className="animate-splash-float">
              <img
                src={patoLogo}
                alt="PaTo"
                className="h-20 w-20 sm:h-22 sm:w-22 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Text Container with Kinetic Animated Letters */}
        <div className="mt-6 flex flex-col items-center text-center">
          {/* Animated "PaTo" Brand Letters */}
          <div className="flex items-center text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm font-sans select-none">
            <span
              className="inline-block"
              style={{
                animation: "splash-letter-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both",
              }}
            >
              P
            </span>
            <span
              className="inline-block"
              style={{
                animation: "splash-letter-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.27s both",
              }}
            >
              a
            </span>
            <span
              className="inline-block"
              style={{
                animation: "splash-letter-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.34s both",
              }}
            >
              T
            </span>
            <span
              className="inline-block"
              style={{
                animation: "splash-letter-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.41s both",
              }}
            >
              o
            </span>
            <span
              className="ml-1 inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
              style={{
                animation: "splash-dot-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.50s both",
              }}
            />
          </div>

          {/* Subtitle Pill with Glassmorphism */}
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-0.5 text-xs font-bold text-blue-50 backdrop-blur-md ring-1 ring-white/20 animate-splash-fade-up-1">
            <span>Pay Together</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-200">Split Bill Pintar</span>
          </div>

          {/* Descriptive Tagline */}
          <p className="mt-2 text-xs font-medium text-white/80 tracking-wide max-w-[250px] animate-splash-fade-up-2">
            Bagi tagihan makan bareng tanpa drama & hitungan ribet
          </p>

          {/* Continuous Progress Indicator (Continuous linear glide - Zero Blink) */}
          <div className="mt-6 w-40 sm:w-44 h-1.5 overflow-hidden rounded-full bg-white/20 backdrop-blur-xs p-0.2">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-200 via-white to-amber-200 shadow-[0_0_10px_rgba(255,255,255,0.85)] animate-splash-progress" />
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
