import { soundFX } from "./soundFx";

/**
 * Universal Native Touch & Click Physics Engine
 * Gives every interactive element (buttons, tabs, icons, links, cards)
 * authentic iOS/Android mobile responsiveness:
 * 1. Physical compression on press (scale 0.92)
 * 2. Snappy spring-release pop on release (scale 0.92 -> 1.035 -> 1.0)
 * 3. Fluid touch ink ripple radiating from exact touch coordinates
 * 4. Micro-haptic vibration and synthesized tap audio
 */
export function initNativeTouchFeedback(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  let currentTarget: HTMLElement | null = null;
  let startX = 0;
  let startY = 0;
  let isScrolling = false;

  function findInteractiveElement(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;

    // Search closest clickable element
    const el = target.closest<HTMLElement>(
      'button, [role="button"], a[href], .touch-press, input[type="submit"], input[type="button"], [data-pressable]'
    );
    if (!el) return null;

    // Ignore disabled or loading elements
    if (
      el.hasAttribute("disabled") ||
      el.getAttribute("aria-disabled") === "true" ||
      el.classList.contains("pointer-events-none")
    ) {
      return null;
    }

    return el;
  }

  function createRipple(el: HTMLElement, clientX: number, clientY: number) {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.8;

    // Reuse or create a dedicated ripple surface inside the element to prevent clipping badges
    let surface = el.querySelector<HTMLElement>(":scope > .pato-ripple-surface");
    if (!surface) {
      surface = document.createElement("span");
      surface.className = "pato-ripple-surface";
      el.appendChild(surface);
    }

    const wave = document.createElement("span");
    wave.className = "pato-ripple-wave";
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;

    // Contrast-aware ripple tone
    const isDark = isElementDark(el);
    wave.style.backgroundColor = isDark
      ? "rgba(255, 255, 255, 0.32)"
      : "rgba(37, 99, 235, 0.16)";

    surface.appendChild(wave);

    // Auto cleanup wave
    window.setTimeout(() => {
      wave.remove();
    }, 450);
  }

  function isElementDark(el: HTMLElement): boolean {
    const classList = el.className;
    if (
      classList.includes("bg-blue-") ||
      classList.includes("bg-slate-900") ||
      classList.includes("bg-slate-800") ||
      classList.includes("bg-emerald-") ||
      classList.includes("bg-rose-") ||
      classList.includes("from-blue") ||
      classList.includes("from-indigo") ||
      classList.includes("bg-gradient")
    ) {
      return true;
    }

    try {
      const bg = window.getComputedStyle(el).backgroundColor;
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        return luma < 140;
      }
    } catch {}

    return false;
  }

  function onPointerDown(e: PointerEvent) {
    // Only respond to primary buttons (left click / touch)
    if (e.button !== 0 && e.pointerType === "mouse") return;

    const el = findInteractiveElement(e.target);
    if (!el) return;

    currentTarget = el;
    startX = e.clientX;
    startY = e.clientY;
    isScrolling = false;

    // Reset release class and apply pressed compression
    el.classList.remove("pato-released");
    el.classList.add("pato-pressed");

    // Spawn visual ink ripple
    createRipple(el, e.clientX, e.clientY);

    // Subtle audio tick & haptic feedback
    soundFX.playTap();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!currentTarget || isScrolling) return;

    // Cancel press if user is scrolling/dragging (> 8px movement)
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (dist > 8) {
      isScrolling = true;
      currentTarget.classList.remove("pato-pressed");
      currentTarget = null;
    }
  }

  function onPointerEnd() {
    if (!currentTarget) return;

    const el = currentTarget;
    currentTarget = null;

    el.classList.remove("pato-pressed");
    el.classList.add("pato-released");

    window.setTimeout(() => {
      el.classList.remove("pato-released");
    }, 260);
  }

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });

  return () => {
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);
  };
}

