# Notifications

## Merged

| Duplicate                          | Canonical                                          |
| ---------------------------------- | -------------------------------------------------- |
| "Notification to user reactivated" | "Notification to reactivation" (`reactivation.md`) |

## Category summary

- Two definitions. `notificationsWeekly` (aggregation, "Notifications delivered", "Notifications opened", "Notification opt-outs") counts receipts and taps per broad type and the opt-out transitions. The `exposure` journey ("Notification to app opened", "Notification to marketplace opened", "Notification to offer viewed", "Notification to offer created", "Notification to chat opened", "Notification to reactivation", 11.x) follows one campaign-like receipt for 7 days and records the outcomes; it is shared with the prompts category, which is why its fields are listed once here.
- "Notifications sent" is backend (`NOTIFICATION_SENT`, `INACTIVITY_NOTIFICATION_SENT`) plus one attribute.
- "Campaign" means `VexlProductNotification.uuid` (one per admin-created product notification, shared by all recipients) or the content-service warning id; no A/B variant concept exists.
- The existing `trackingId` is per notification and stays in the backend delivery-debugging path; it is never carried into the new system.

## Common building blocks

- **Receipt points**: push and Android background socket enter `apps/mobile/src/utils/notifications/notificationReceivedHandler/index.ts` (`processNotification`, dispatch by `_tag`); foreground socket messages go through `useConsumeNotificationStream.ts`. Client-scheduled local notifications (`newOffersNotification.ts`, `marketplaceReadyNotification.ts`, `tradeReminderNotifications.ts`, `NEW_CONTACTS_TO_SYNC`) are counted at their scheduling site.
- **Display point**: `displayLocalNotification.ts`; iOS OS-displayed chat alerts are only observable through `getSystemNotificationsIdsActionAtom` (`cancelNewChatNotifications.ts`), so `displayed` is a lower bound on iOS.
- **Tap point**: `reactOnNotificationOpenAtom` in `apps/mobile/src/state/useHandleNotificationOpen.ts`, deduped by `lastHandledExpoNotificationDateAtom`; its branches classify the type.
- **Type enum**: `NotificationType` in `docs/analytics/definitions-index.md`, from the server task tags and the client local types.
- **Outcomes** (same sites everywhere): marketplace load = "Users who see at least one offer" hook; offer created = `createOfferActionAtom`; chat initiated = `sendRequestActionAtom`; import = `submitContactsActionAtom` success; permission granted = `requestPermissions` success in `checkAndAskForPermissionsActionAtom.ts`.
- **`exposure` journey** (7 days, day precision, country stored, uploaded on each step): `source` (`notification`, `prompt`), `type`, `campaign` (optional, 32 characters max), `step` (`received`, `tapped` for notifications; `shown`, `dismissed`, `ctaClicked` for prompts), `displayed`, `foregroundOpen`, `daysToOpen` (`DaysBucket`), `dormantAtBaseline` (from `lastCoreActionAt`, 30-day gap), `importEligible` (`importedContactsCountAtom === 0`), `exposedOnMarketplace`, outcomes `marketplaceLoaded`, `offerCreated`, `chatInitiated`, `importCompleted`, `permissionGranted`. One open journey per `type` plus `campaign` per device; a repeat exposure while one is open updates it instead of enrolling again. Chat notifications do not enrol.

### Notifications sent

- **Status: planned**.
- **Type**: backend. `NOTIFICATION_SENT` (`apps/notification-service/src/metrics.ts`) plus a new `notificationType` attribute from the task `_tag`; `INACTIVITY_NOTIFICATION_SENT` for reminders.
- **Definition**: Backend send attempts by broad type, aggregated to day. A send is not a delivery. Client-scheduled local notifications are not sent by anyone and appear in "Notifications delivered" only.
- **Where in the code**: `reportNotificationSent` is called from `PushNotificationService/index.ts`, `SendMessageTaskProcessor.ts` and `NotificationRpcHandles.ts`; `ExpoClientService` never reads tickets.
- **Privacy notes**: exact `sentAt` plus `trackingId` per row stays internal; the dashboard reads day aggregates by type.

### Notifications delivered

- **Status: planned**
- **Type**: aggregation `notificationsWeekly` (week). This section defines the record: counters (cap 50) `received<Type>` and `tapped<Type>` per `NotificationType`, `displayed`; booleans `permissionEnabledToDisabled`, `permissionDisabledToEnabled`, `prefOptOut<Preference>`, `prefOptIn<Preference>`.
- **Definition**: Renamed "observed device receipts": a handler ran for the notification. Receipts are a lower bound on delivery; provider acceptance is not delivery.
- **Where in the code**: one increment at the top of `processNotification` and in the stream consumer, keyed by `_tag`; one at `displayLocalNotification`. Today only chat (`reportNotificationProcessed`) and network notices report anything, and those stay on the backend path.
- **Privacy notes**: no `trackingId`, inbox or sender keys, or `preview`. Chat receipt counts reveal chat volume, hence the cap and the weekly bucket.

### Notifications opened

- **Status: planned**
- **Type**: aggregation `notificationsWeekly`, counters `tapped<Type>`; plus the `tapped` step on the `exposure` journey for campaign-like types.
- **Definition**: Taps from the notification-tap callback, deduplicated locally, by broad type; per campaign through the journey. Product notifications opened from the in-app Notifications screen are not counted as taps.
- **Where in the code**: `reactOnNotificationOpenAtom`; the decode branches give the type and, for product notifications, the campaign `uuid`.
- **Privacy notes**: never the chat `inbox` / `sender` keys, the browser `url` or the club uuid from the tap payload.

### Notification to app opened

- **Status: planned**.
- **Type**: journey `exposure` (source `notification`), fields `step = tapped`, `foregroundOpen`, `daysToOpen`.
- **Definition**: Direct tap opens, separated from any later foreground open within 7 days of receipt (association only). Enrol campaign-like types only; chat notifications would create a journey per message.
- **Where in the code**: tap = "Notifications opened"; later open = `useAppState` reporting `active` with no new notification response, evaluated in the start and resume in-app loading tasks against the open journeys.
- **Privacy notes**: receipt day, not time; `daysToOpen` is a bucket.

### Notification to marketplace opened

- **Status: planned**.
- **Type**: journey `exposure`, outcome `marketplaceLoaded`.
- **Definition**: A successful main-marketplace load within 7 days of receipt among enrolled recipients. For `newOffers` and `marketplaceReady` taps the handler navigates straight to the marketplace, so the outcome is tap-attributed by construction and the dashboard shows it as such.
- **Where in the code**: the "Users who see at least one offer" load hook sets the flag on every open exposure journey.
- **Privacy notes**: boolean only; campaign rows below the suppression threshold are hidden.

### Notification to offer viewed

- **Status: deferred**. CSV decision: defer until a UX question needs it. Would be one more outcome boolean (`detailOpened`) on the `exposure` journey from the `OfferDetailScreen` mount hook.

### Notification to offer created

- **Status: planned**.
- **Type**: journey `exposure`, outcome `offerCreated`.
- **Definition**: A successful creation (any creation class, since every offer reaches the contact network) within 7 days of receipt, once per instance and campaign.
- **Where in the code**: `createOfferActionAtom` resolving sets the flag; backend `OFFER_CREATED` cannot be tied to a notification and is not used.
- **Privacy notes**: no `offerType`, class or club info on the journey.

### Notification to chat opened

- **Status: planned**.
- **Type**: journey `exposure`, outcome `chatInitiated`.
- **Definition**: A successful conversation initiation within 7 days of receipt. Chat-screen opens are not counted; chat notifications themselves are not enrolled, so this measures campaign-type notifications leading to a new request.
- **Where in the code**: `sendRequestActionAtom` resolving sets the flag.
- **Privacy notes**: boolean only.

### Notification to user reactivated

Merged into "Notification to reactivation" (`reactivation.md`). Dashboard label: core action within 7 days among enrolled recipients with `dormantAtBaseline = true`, never over all sends.

### Notification opt-outs

- **Status: planned**
- **Type**: aggregation `notificationsWeekly`, booleans `permissionEnabledToDisabled`, `permissionDisabledToEnabled`, `prefOptOut<Preference>`, `prefOptIn<Preference>`.
- **Definition**: OS permission transitions detected when the state is next observed (the time of the change is unknown), and in-app preference toggles, counted separately. Uninstalls are not opt-outs. Booleans per week, since a device almost never transitions twice.
- **Where in the code**: OS state via `areNotificationsEnabledAtom` refreshed by `refreshNotificationTokenOnResumeTask.ts`, diffed against the new persisted "last observed permission state" marker; grants in `checkAndAskForPermissionsActionAtom.ts`. Preferences in `NotificationPreferences` (`apps/mobile/src/utils/preferences/domain.ts`), toggled in `NotificationSettingsScreen/index.tsx`. The marketing base is known server-side (`selectVexlTokens('marketing')`) and can be a backend gauge if wanted.
- **Privacy notes**: do not attach the permission state to unrelated events (the `reportNotificationInteraction` query params do that today and can be dropped).

### Performance by notification type

- **Status: planned**.
- **Type**: mixed, dashboard view. Sends by type ("Notifications sent"), receipts and taps by type ("Notifications delivered", "Notifications opened"), 7-day outcomes by type from `exposure` journeys grouped by `type` and week.
- **Definition**: Observational comparison of fixed broad types with the same definitions and minimum group sizes. Causal lift needs a randomized holdout, which does not exist and is not built.
- **Where in the code**: nothing beyond "Notifications sent", "Notifications delivered", "Notifications opened", "Notification to app opened", "Notification to marketplace opened", "Notification to offer viewed", "Notification to offer created", "Notification to chat opened"; there is no holdout or variant mechanism anywhere (`insertPendingForVexlProductNotification` fans out to every `marketing` / `general` token).
- **Privacy notes**: small types (club flagged, login on different device) fall under suppression; no type by country by version cross-tabs.
