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

## Android presentation: conversations and groups

`expo-notifications` builds plain title/text notifications on Android. `packages/expo-android-notification-presentation` adds a `NotificationsService` subclass registered with a higher priority than the one shipped by `expo-notifications`, so its presentation delegate can adjust the notification Expo built based on keys in the notification `data`.

Chat messages are shown as one notification per conversation rendered with Android's `MessagingStyle`: the notification id is the conversation id (inbox + sender), each new message reads the earlier messages back from the presented notification's data, appends itself and re-posts under the same id, so the notification lists the person's messages under the same name and avatar the chat screen shows (anonymous SVG avatar or revealed photo, see `getOtherSideData`) and dismissing the chat dismisses all of them. Android 11+ shows the avatar in the collapsed row only for "conversations", which requires a long-lived shortcut per chat: the native delegate publishes one with the conversation id and removes it together with the notification. While the notification exists the chat also appears on the launcher's app long-press menu (name and avatar, on-device only); launcher-excluded shortcuts cannot be used because the shortcut service drops them on devices without AppSearch-backed shortcuts, the default. Per-conversation notification groups with a summary were dropped because Android 16+ merges groups with fewer than three members into one app-wide stack and drops the app's summaries.

Messaging requests keep a shared Android notification group with a summary row; the summary is a normal local notification whose identifier is the group id and it is dismissed once no request notification is left. iOS threads chat notifications by `threadIdentifier` (conversation id, or the shared request id).
