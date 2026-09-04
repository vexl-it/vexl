# expo-android-notification-presentation

`expo-notifications` builds every Android notification the same way: title, text, optional subtitle. This package adds two Android-only presentation features on top of it without forking the library.

- `src/index.ts` — schemas for the keys the native side reads from the notification `data`:
  - `androidGroupId` / `androidGroupSummary` (`androidNotificationGroupData()`) put the notification into an Android notification group, optionally as the group's summary.
  - `androidConversation` renders the notification with `MessagingStyle`: one notification per conversation listing its messages under the sender's name and avatar (inline SVG rasterized with AndroidSVG, or an image URI). On Android 11+ the notification references the chat's long-lived shortcut (see below), which is what makes Android use its conversation layout (avatar in the collapsed row, "Conversations" section).
  - `setConversationShortcuts()` publishes long-lived shortcuts, one per chat, that open the chat through a deep link. They appear on the launcher's app long-press menu (the first few, by rank) and double as the conversation reference for notifications. The list is replaced on every call; the notification path also pushes the shortcut of its own chat so it exists when a message arrives in the background. Launcher-excluded shortcuts are not an option: the shortcut service drops them unless AppSearch-backed shortcuts are enabled on the device, which is off by default.
- `android/` — a `NotificationsService` subclass registered with a higher priority than the one shipped by `expo-notifications`, so Expo routes every notification event through it. Its presentation delegate lets Expo build the notification as usual and then applies the group and the messaging style from the data keys.

A group summary is a regular local notification with the group id as its identifier; show it after the children and dismiss it once the group has no children left. Keep groups for notifications that arrive in bulk (Android 16+ merges groups with fewer than three members into one app-wide stack); for chats use the conversation rendering instead.
