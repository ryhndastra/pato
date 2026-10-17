/**
 * Pato Haptic Feedback Engine
 * Provides authentic, crisp vibration feedback on mobile browsers supporting navigator.vibrate
 */

export const haptic = {
  /** Light click tick (10ms) - for item claim/unclaim, counter stepper, small buttons */
  light() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore if device or browser restricts vibration
      }
    }
  },

  /** Medium tap (20ms) - for tab switching, copying, opening modals */
  medium() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(22);
      } catch {}
    }
  },

  /** Success double pulse ([20ms, 40ms pause, 30ms]) - for payment uploaded, locked, verified */
  success() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([20, 40, 35]);
      } catch {}
    }
  },

  /** Warning / Alert ([35ms, 40ms pause, 35ms]) - for reject, delete, errors */
  warning() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([35, 40, 35]);
      } catch {}
    }
  },

  /** Celebration fanfare pattern - when the bill is fully paid & room closed */
  celebrate() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([35, 50, 35, 50, 60]);
      } catch {}
    }
  },
};

