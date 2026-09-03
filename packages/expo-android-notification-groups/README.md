# expo-android-notification-groups

`expo-notifications` has no API for Android notification groups (a per-group summary row that collapses several notifications). This package adds it without forking the library.

- `src/index.ts` — `androidNotificationGroupData()` puts the group id (and whether the notification is the group summary) into the notification `data`.
- `android/` — a `NotificationsService` subclass registered with a higher priority than the one shipped by `expo-notifications`, so Expo routes every notification event through it. Its presentation delegate lets Expo build the notification as usual and then applies `setGroup` / `setGroupSummary` from the data keys.

The summary notification is a regular local notification with the group id as its identifier; show it after the children and dismiss it once the group has no children left.
