"use client";
/**
 * Registro de notificaciones push web (Firebase Cloud Messaging) para el
 * panel admin. Permite que los pedidos nuevos lleguen como notificación del
 * sistema en el celular aunque Chrome esté cerrado o en segundo plano.
 *
 * No agrega dependencias npm: carga el SDK compat de Firebase desde gstatic
 * en runtime (mismo origen que usa el service worker vía importScripts).
 *
 * Config pública requerida (Firebase Console → Project settings):
 *   NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
 *   NEXT_PUBLIC_FIREBASE_APP_ID, NEXT_PUBLIC_FIREBASE_VAPID_KEY
 * Si falta alguna, todo es no-op (devuelve "unconfigured").
 */

const FIREBASE_JS_VERSION = "10.13.2";

type FirebaseCompat = {
  apps: unknown[];
  initializeApp: (config: Record<string, string>) => void;
  messaging: () => {
    getToken: (opts: {
      vapidKey: string;
      serviceWorkerRegistration: ServiceWorkerRegistration;
    }) => Promise<string>;
  };
};

declare global {
  interface Window {
    firebase?: FirebaseCompat;
  }
}

function getConfig(): { config: Record<string, string>; vapidKey: string } | null {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
  if (Object.values(config).some((v) => !v) || !vapidKey) return null;
  return { config, vapidKey };
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    "PushManager" in window &&
    getConfig() !== null
  );
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(el);
  });
}

export type PushSetupResult =
  | "granted"      // token registrado, notificaciones activas
  | "denied"       // el usuario bloqueó las notificaciones
  | "unsupported"  // navegador sin soporte
  | "unconfigured" // faltan env vars NEXT_PUBLIC_FIREBASE_*
  | "error";

/**
 * Pide permiso (si hace falta), registra el service worker y sube el token
 * FCM a /api/users/fcm-token. Idempotente — llamar en cada carga del panel
 * mantiene el token fresco.
 */
export async function enablePushNotifications(): Promise<PushSetupResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    return "unsupported";
  }
  const cfg = getConfig();
  if (!cfg) return "unconfigured";

  try {
    const permission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
    if (permission !== "granted") return "denied";

    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_JS_VERSION}`;
    await loadScript(`${base}/firebase-app-compat.js`);
    await loadScript(`${base}/firebase-messaging-compat.js`);
    const firebase = window.firebase;
    if (!firebase) return "error";
    if (firebase.apps.length === 0) firebase.initializeApp(cfg.config);

    // El SW recibe la config por query string (no puede leer env vars).
    const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(cfg.config).toString()}`;
    const registration = await navigator.serviceWorker.register(swUrl);
    await navigator.serviceWorker.ready;

    const token = await firebase.messaging().getToken({
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return "error";

    const res = await fetch("/api/users/fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return res.ok ? "granted" : "error";
  } catch (e) {
    console.error("[fcmClient] enablePushNotifications failed:", e);
    return "error";
  }
}
