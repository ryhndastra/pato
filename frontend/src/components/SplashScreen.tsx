import { useEffect, useState } from "react";
import patoMascot from "../assets/pato.png";

interface SplashScreenProps {
  onFinish?: () => void;
  /** Minimum duration in ms before starting exit animation (default: 1700ms) */
  minDuration?: number;
}

export function SplashScreen({ onFinish, minDuration = 1700 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Reveal text shortly after logo pop
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 280);

    // Trigger exit animation
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, minDuration);

    // Complete exit and unmount
    const finishTimer = setTimeout(() => {
      onFinish?.();
    }, minDuration + 400);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  function handleSkip() {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onFinish?.();
    }, 300);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white select-none transition-all duration-400 ease-out cursor-pointer ${
        isExiting
          ? "opacity-0 scale-[1.04] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl animate-pulse" />

      {/* Subtle background radial grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Centerpiece Content */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Pulsing Ripple Rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-36 w-36 rounded-full border border-white/20 animate-splash-ring-1 pointer-events-none" />
          <div className="absolute h-36 w-36 rounded-full border border-blue-200/30 animate-splash-ring-2 pointer-events-none" />

          {/* Glowing Aura */}
          <div className="absolute h-32 w-32 rounded-full bg-white/20 blur-xl pointer-events-none" />

          {/* Logo Card */}
          <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-[36px] border-4 border-white/90 bg-white shadow-[0_24px_50px_rgba(26,54,138,0.45)] animate-splash-pop">
            <div className="animate-splash-float">
              <img
                src={patoMascot}
                alt="PaTo"
                className="h-20 w-20 sm:h-22 sm:w-22 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Text Container */}
        <div
          className={`mt-6 flex flex-col items-center text-center transition-all duration-500 ${
            textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
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

          <p className="mt-2 text-xs font-medium text-white/75 tracking-wide max-w-[240px]">
            Bagi tagihan makan bareng tanpa drama & hitungan ribet
          </p>

          {/* Sleek Progress Indicator */}
          <div className="mt-7 w-32 h-1 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
            <div className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-splash-progress" />
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
