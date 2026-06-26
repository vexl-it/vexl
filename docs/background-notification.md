# Notification handling

Vexl reacts to incoming push notifications in two places, depending on app state:

- `apps/mobile/src/utils/notifications/backgroundHandler.ts` — `processBackgroundMessage`, runs when the app is in the background / killed.
- `apps/mobile/src/state/useHandleReceivedNotifications.ts` — `processNotification` (foreground hook), runs while the app is active.

All shared notification types are defined in `@vexl-next/domain/src/general/notifications`.

## `backgroundHandler.ts` — `processBackgroundMessage`

Notification types reacted to, in the order they're checked:

| # | Notification type | Action |
|---|---|---|
| 1 | `NewChatMessageNoticeNotificationData` | Process chat notification (`processChatNotificationActionAtom`) |
| 2 | `NewSocialNetworkConnectionNotificationData` | Report new connection, sync connections, re-encrypt all offers (background) |
| 3 | `NewClubConnectionNotificationData` | Sync the named clubs' handle state, re-encrypt all offers (background) |
| 4 | `AdmitedToClubNetworkNotificationData` | Check for clubs admission |
| 5 | `ClubDeactivatedNotificationData` | Sync/remove club, record reason, show local notification + add to notification center |
| — | *fallback* | `showUINotificationFromRemoteMessage(payload)` |

## `useHandleReceivedNotifications.ts` — `processNotification` (foreground hook)

| # | Notification type | Action |
|---|---|---|
| 1 | `NewChatMessageNoticeNotificationData` | Process chat notification |
| 2 | *(any UI-displayable)* | `showUINotificationFromRemoteMessage(payload)` — returns early if handled |
| 3 | `VexlProductNotificationData` | Process Vexl product notification |
| 4 | `NewSocialNetworkConnectionNotificationData` | Report new connection, sync connections, re-encrypt offers (foreground) |
| 5 | `NewClubConnectionNotificationData` | Sync the named clubs, re-encrypt offers (foreground) |
| 6 | `AdmitedToClubNetworkNotificationData` | Check for clubs admission |
| 7 | `ClubDeactivatedNotificationData` | Sync/remove club, record reason, local notification + notification center |
| — | *fallback* | `reportError('warn', 'Unknown notification type')` |

## Differences between the two

- **`VexlProductNotificationData`** is handled **only in the foreground hook**, not in the background handler.
- The **background handler** checks `NewChatMessageNoticeNotificationData` first, then falls through to `showUINotificationFromRemoteMessage` as the last resort. The **hook** runs `showUINotificationFromRemoteMessage` early (right after chat) and returns if it handled the message, before checking the remaining types.
- The background handler's unknown-type fallback shows a UI notification; the hook's fallback logs a warning (`Unknown notification type`).
- The hook short-circuits on Android when the app is **not active** (delegating to the background task); the background handler short-circuits on Android when the app **is active** (delegating to the hook).
