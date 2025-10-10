// Give the service worker access to Firebase Messaging.
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAfiY0dovwWpPygs7X-3gR4J6Q1KDDF8ps",
  authDomain: "auth-fa6e5.firebaseapp.com",
  projectId: "auth-fa6e5",
  storageBucket: "auth-fa6e5.firebasestorage.app",
  messagingSenderId: "551410579316",
  appId: "1:551410579316:web:243d034c5d48cbb58e5e21",
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon:
      payload.notification?.icon || payload.notification?.image || "/logo.png",
    badge: "/logo.png",
    tag: payload.messageId || Date.now().toString(),
    data: {
      ...payload.data,
      notification: payload.notification, // Include full notification data
      actionUrl: payload.data?.actionUrl || "/dashboard",
    },
    image: payload.notification?.image, // Add image support
  };

  // Send message to client to update badge
  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "NOTIFICATION_RECEIVED",
          notification: {
            id: payload.messageId || Date.now().toString(),
            type: payload.data?.type || "system_announcement",
            title: notificationTitle,
            body: notificationOptions.body,
            icon: notificationOptions.icon,
            image: payload.notification?.image,
            data: payload.data,
            read: false,
            createdAt: new Date().toISOString(),
            actionUrl: payload.data?.actionUrl,
          },
        });
      });
    });

  // Show system notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.actionUrl || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
