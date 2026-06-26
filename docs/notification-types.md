# Notification types — what the app can receive and when

This document is a catalog of the push notification types the Vexl mobile app
can receive, and the real-world event that triggers each one. It intentionally
does **not** describe how the front end reacts to them — for the per-handler
behavior (foreground hook vs. background handler) see
[`background-notification.md`](./background-notification.md).

## Delivery model (foreground vs. background)

A notification can arrive while the app is **open** (foreground) or **closed /
backgrounded**. The app state at delivery time decides which code path receives
it, **not** the notification type — almost every type below can arrive in either
state. Two delivery shapes exist:

- **Data (silent) notification** — payload only, no system tray entry. Used to
  trigger background syncing.
- **System notification** — payload plus a visible title/body shown in the OS
  notification tray.

Some events send both (e.g. a new chat message sends a silent data notification
to sync, and optionally a visible system notification). The "Push shape" column
in the catalog and the [grouped summary](#push-shape-summary) below say exactly
which shape(s) each type is delivered as.

Note: a *silent* push from the server is not the same as "the user sees
nothing" — several silent-only types are turned into a **client-generated local
notification** after the app processes them (so the visible alert is built on
the device, not sent by the server). This document classifies by what the
**server sends over the wire**.

All payload types are defined in
`packages/domain/src/general/notifications/index.ts`. The payloads themselves
carry no sensitive plaintext — they signal "something happened, go sync" and the
client fetches and decrypts the actual content.

## Notification catalog

| Type | When it is received (trigger) | Push shape | Sent by |
|---|---|---|---|
| `NewChatMessageNoticeNotificationData` | A counterparty client sends a chat message/action to the user; the sender's client asks the backend to relay a notice so the recipient fetches it. | **Silent + system** ¹ | notification-service (`issueNotification`), relayed on behalf of the sending client |
| `NewSocialNetworkConnectionNotificationData` | Someone in the user's social graph (1st/2nd degree contact) joins Vexl or refreshes contacts such that a new mutual connection appears. | Silent only | contact-service (contact import / user refresh) |
| `NewClubConnectionNotificationData` | A new user joins (or is added to) a club the user is a member of. Carries the affected club UUID(s). | Silent only | contact-service (join club / moderator add) |
| `AdmitedToClubNetworkNotificationData` | A moderator admits the user into a club. Carries the moderator/club public key. | Silent only | contact-service (moderator add) |
| `ClubDeactivatedNotificationData` | A club the user belongs to is deactivated — `EXPIRED` (reached end date), `FLAGGED` (removed for violations), or `OTHER`. Carries the club UUID and reason. | Silent only ² | contact-service (internal scheduled deactivation) |
| `UserInactivityNotificationData` | The user has not been active for a configured number of days (re-engagement reminder). | Silent only ² | contact-service (internal scheduled job) |
| `NewContentNotificationData` | New content is available and the user was last active beyond a configured threshold. | Silent only ² | contact-service (internal scheduled job) |
| `UserLoginOnDifferentDeviceNotificationData` | A login for the user's account is performed on a different device (with the notify-existing-user flag set). | Silent only ² | contact-service (check-user-exists) |
| `VexlProductNotificationData` | An operator publishes a Vexl product / announcement notification with push enabled; it is batched and delivered to subscribed users. | **System only** ³ | content-service → notification-service batch worker |
| `OpenBrowserLinkNotificationData` | Carries a URL to open. **Defined but not currently emitted by any backend service** — reserved/handled only on the client open path. | — (not sent) | — (no backend sender) |

¹ Always sends a **silent** data notification (to trigger the mailbox fetch).
**Additionally** sends a **visible system** notification *only when the sending
client sets `sendNewChatMessageNotification: true`* on the `issueNotification`
call — so the recipient sees a tray alert for messages worth alerting on, while
silent control events (read receipts, cypher updates, etc.) sync without one.

² Sent as a **silent** push, but the client builds a **local** (on-device)
notification when it processes it, so the user does see a visible alert — it is
just not a server-sent system notification.

³ Carries a visible title/body, so it arrives as a **system** notification. A
push is only issued when `issuePushNotification` is true; otherwise the
announcement is stored and surfaced in-app (notification center) without any
push.

### Push-shape summary

- **Both silent + system:** `NewChatMessageNoticeNotificationData` (system part
  is conditional — see note ¹).
- **System (visible) only:** `VexlProductNotificationData`.
- **Silent (data-only) only:** `NewSocialNetworkConnectionNotificationData`,
  `NewClubConnectionNotificationData`, `AdmitedToClubNetworkNotificationData`,
  `ClubDeactivatedNotificationData`, `UserInactivityNotificationData`,
  `NewContentNotificationData`, `UserLoginOnDifferentDeviceNotificationData`.
- **Not sent by the backend:** `OpenBrowserLinkNotificationData`.

## Chat notification subtypes

`NewChatMessageNoticeNotificationData` is only the *notice* that triggers the
client to fetch its mailbox. The semantic kind of the chat event lives inside
the fetched, end-to-end-encrypted message as `ChatNotificationData.type`
(`ChatNotificationType`), and is determined by the sending client — not by the
server. The possible values:

| `ChatNotificationType` | Meaning |
|---|---|
| `MESSAGE` | Plain chat message |
| `REQUEST_MESSAGING` | Request to start a conversation (from an offer) |
| `APPROVE_MESSAGING` | Messaging request approved |
| `DISAPPROVE_MESSAGING` | Messaging request rejected |
| `CANCEL_REQUEST_MESSAGING` | Messaging request cancelled by sender |
| `REQUEST_REVEAL` | Request to reveal identity |
| `APPROVE_REVEAL` | Identity reveal approved |
| `DISAPPROVE_REVEAL` | Identity reveal rejected |
| `REQUEST_CONTACT_REVEAL` | Request to reveal contact details |
| `APPROVE_CONTACT_REVEAL` | Contact reveal approved |
| `DISAPPROVE_CONTACT_REVEAL` | Contact reveal rejected |
| `DELETE_CHAT` | Counterparty deleted the chat |
| `BLOCK_CHAT` | Counterparty blocked the chat |
| `MESSAGE_READ` | Read receipt |
| `FCM_CYPHER_UPDATE` | Counterparty's notification token/cypher changed |
| `VERSION_UPDATE` | Client version signaling |
| `UNKNOWN` | Fallback for unrecognized types |

These subtypes are not separate push notification types — they are the contents
of relayed chat messages, surfaced after the client fetches and decrypts them.
