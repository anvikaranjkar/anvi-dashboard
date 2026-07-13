self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let message = {};
  try { message = event.data ? event.data.json() : {}; } catch { message = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(message.title || "Anvi’s Dashboard", {
    body: message.body || "You have a new reminder.",
    tag: message.tag || "anvis-dashboard-push",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: message.url || "/" },
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(windows => {
    const existing = windows.find(windowClient => windowClient.url.startsWith(self.location.origin));
    if (existing) return existing.focus().then(() => existing.navigate(target));
    return self.clients.openWindow(target);
  }));
});
