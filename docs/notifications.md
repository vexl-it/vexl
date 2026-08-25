# Notification delivery

Vexl delivers durable notifications through three channels:

1. Sockets — the foreground socket the app opens while it is active, and on Android optionally a background socket kept open by a foreground service.
2. Expo push — used when no socket delivered the notification within the 30-second window (or no socket is connected at all).

Both sockets use `listenToNotifications` on the notification service RPC endpoint and identify themselves with `connectionKind`. A missing `connectionKind` means `foreground`, which keeps older clients compatible. The server sends a notification to every connected socket of a secret; when the app is in the foreground the native side skips the background delivery, so the foreground socket owns that case.

Stream-only chat messages, such as typing indicators, go only to foreground sockets. They never start background JavaScript and never fall back to push.

## Android background socket

`packages/expo-background-notification-socket` runs a `remoteMessaging` foreground service that keeps the background socket connected and shows a persistent low-importance notification. It stores the notification secret and endpoint in encrypted preferences so it can reconnect after the JavaScript runtime stops or the device restarts: the service is started natively on every process start (plus after boot and app updates) whenever the stored preferences say it should run, and the stored credentials are wiped only on logout. Every received message is acknowledged to the server and then handed to the existing JavaScript notification-processing pipeline through a Headless JS task — unless the app currently has a foreground activity.

The channel is offered (and enabled when the user agrees) on devices without Google services; the explanation also covers the battery-optimisation exemption the service needs to survive Doze. A periodic wake-up alarm (exact when the user grants Alarms &amp; reminders, inexact otherwise) additionally revives the process in Doze to detect and replace a silently dead socket. Devices with Google services keep using push by default and can enable the background socket in notification settings. Push registration remains active so push can still serve as the last fallback.

## Metrics

`NOTIFICATION_SENT.channel` identifies `foreground_socket`, `background_socket`, or `push`. `NOTIFICATION_PROCESSED` continues to report when the client finishes processing a durable notification.
