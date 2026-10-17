/**
 * PaTo Notification Manager
 * Handles Web Notification API, custom permission primer flow,
 * and browser push notifications for both Hosts and Guests.
 */

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionState;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch (err) {
    console.error("[Notification.requestPermission error]", err);
    return false;
  }
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
}

/**
 * Triggers a native system / browser notification.
 * Works on Android Chrome, desktop browsers, and iOS PWA (Safari 16.4+).
 */
export function sendBrowserNotification({
  title,
  body,
  icon = "/pato.png",
  tag,
  url,
}: ShowNotificationOptions): boolean {
  if (getNotificationPermissionState() !== "granted") {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: tag || "pato-room",
    });

    notif.onclick = () => {
      window.focus();
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.error("[sendBrowserNotification error]", err);
    return false;
  }
}

