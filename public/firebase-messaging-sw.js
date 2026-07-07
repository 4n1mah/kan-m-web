/* eslint-disable no-undef */
/**
 * Service worker de Firebase Cloud Messaging (web push).
 *
 * Muestra notificaciones del sistema (Android/desktop) aunque la pestaña del
 * panel esté cerrada. La config pública de Firebase llega por query string al
 * registrar el SW (ver src/lib/fcmClient.ts) — los SW no pueden leer env vars.
 */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

// El backend manda mensajes data-only (src/lib/push.ts); armamos la
// notificación aquí según data.type.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  let title = "Kan M";
  let body = "Tienes una novedad en el panel.";
  let url = "/admin/dashboard";

  if (data.type === "new_order") {
    title = "🎂 Nuevo pedido — Kan M";
    body = `${data.name || "Cliente"} · evento el ${data.eventDate || ""}`.trim();
  } else if (data.type === "new_cart_order") {
    title = "🛒 Nueva orden del catálogo — Kan M";
    body = `${data.customerName || "Cliente"} · ${data.code || ""} · RD$${data.total || ""}`;
    url = "/admin/ordenes";
  } else if (data.type === "whatsapp_escalation") {
    title = "💬 Cliente pide atención humana — Kan M";
    body = `${data.clientName || data.phone || "Cliente"}: ${data.motivo || ""}`;
    url = "/admin/whatsapp";
  }

  self.registration.showNotification(title, {
    body,
    icon: "/logo-kanm.png",
    badge: "/logo-kanm.png",
    tag: `kanm-${data.type || "general"}-${data.entityId || Date.now()}`,
    data: { url },
  });
});

// Al tocar la notificación: enfocar una pestaña abierta del panel o abrir una.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
