# Pop-ups and in-app prompts

## Merged

| Duplicate | Canonical |
| --------- | --------- |
| none      |           |

## Category summary

- The whole category is the `exposure` journey with `source = prompt` (fields listed in `notifications.md`, common building blocks): steps `shown`, `dismissed`, `ctaClicked` and the 7-day outcome flags. No weekly impression counters are built; exposed instances per prompt come from the journeys, and impressions were optional in the CSV.
- "Variant" means `PromptId` (fixed enum, `docs/analytics/definitions-index.md`) and, for the remote full-screen warning, the warning `id` as `campaign`. No A/B concept exists.
- Three render families cover every prompt: marketplace suggestion banners (`marketplaceFirstOfferBannerAtom` picks one; all render through `DismissableMarketplaceBanner.tsx`), global dialogs (`askAreYouSureActionAtom` / `globalDialogAtom` in `GlobalDialog.tsx`, which needs a `promptId` argument) and the remote full-screen warning (`OverlayInfoScreen` in `FullscreenWarningScreen/index.tsx`).
- Marketplace banners render on the marketplace, so "Pop-up to marketplace opened" only means something for warnings and dialogs shown elsewhere (`exposedOnMarketplace` excludes the rest).
- One open journey per `PromptId` (plus warning id) per device; a repeat render while it is open is not a new exposure.

## Prompt inventory

| PromptId                       | Shown by                                                                             | Dismiss                                                            | CTA                                           |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------- |
| `mpImportContacts`             | `ImportContactsMarketplaceSuggestion.tsx`                                            | `dismissImportContactsInMarketplaceSuggestionActionAtom`           | `useAddContactsFromMarketplaceAction`         |
| `mpImportNewContacts`          | `ImportNewContactsMarketplaceSuggestion.tsx`                                         | `dismissImportNewContactsInMarketplaceSuggestionActionAtom`        | same                                          |
| `mpCreateOffer`                | `CreateOfferMarketplaceSuggestion.tsx`                                               | `dismissCreateOfferInMarketplaceSuggestionActionAtom`              | `navigation.navigate('CRUDOfferFlow')`        |
| `mpEnableNotifications`        | `EnableNotificationsMarketplaceSuggestion.tsx`                                       | `dismissEnableNotificationsInMarketplaceSuggestionActionAtom`      | `useEnableNotificationsFromMarketplaceAction` |
| `mpEnableBackgroundRefresh`    | `EnableBackgroundRefreshMarketplaceSuggestion.tsx` (iOS)                             | `dismissEnableBackgroundRefreshInMarketplaceSuggestionActionAtom`  | opens settings                                |
| `mpMissingProductCategories`   | `MissingProductCategoriesMarketplaceSuggestion.tsx`                                  | `dismissMissingProductCategoriesInMarketplaceSuggestionActionAtom` | edit offer                                    |
| `mpBubble*`                    | `apps/mobile/src/components/MarketplaceSuggestion.tsx` (`offerSuggestionVisible.ts`) | close icon                                                         | `onButtonPress`                               |
| `warning` (+ `campaign`)       | `FullscreenWarningScreen/index.tsx`                                                  | `setCancelledIdActionAtom`                                         | `openUrl(action.url)`                         |
| `dialogNotificationPermission` | `checkAndAskForPermissionsActionAtom.ts`                                             | `UserDeclinedError`                                                | `requestPermissions`                          |
| `dialogDonation`               | `showDonationPromptGiveLoveActionAtom.ts`                                            | `UserDeclinedError`                                                | navigate `DonationsFlow`                      |
| `dialogMarketplaceIntro`       | `showMarketplaceIntroDialogIfNeededActionAtom.ts`                                    | got it                                                             | none                                          |
| `dialogNotesBoardIntro`        | `showNotesBoardIntroSheetIfNeededActionAtom.ts`                                      | close                                                              | none                                          |
| `dialogChatRating`             | `UserFeedbackDialog.tsx`                                                             | close                                                              | submit                                        |

### Pop-ups shown

- **Status: planned**
- **Type**: journey `exposure` (source `prompt`), enrolment with `step = shown`, attributes `importEligible`, `dormantAtBaseline`, `exposedOnMarketplace`.
- **Definition**: The prompt visibly rendered in the foreground; fetched content is not an exposure. Exposed instances per prompt = journeys per `type`.
- **Where in the code**: banners: the chosen component mounting inside `MarketplaceScreenContent.tsx` while the tab is focused and `AppState` is active; dialogs: the `askAreYouSureActionAtom` / `globalDialogAtom` setter with the new `promptId` argument; warning: `OverlayInfoScreen` rendering with `isWarningClosedAtom` false. `exposedOnMarketplace` from `navigationRef.getState()`.
- **Privacy notes**: the warning id is a global content id; never its title or url.

### Pop-ups dismissed

- **Status: planned**
- **Type**: journey `exposure`, `step = dismissed`.
- **Definition**: An explicit dismiss of an exposed prompt. Leaving the screen or killing the app is not a dismiss.
- **Where in the code**: the `dismiss*InMarketplaceSuggestionActionAtom` setters in `offerSuggestionVisible.ts` (secondary button only; the primary CTA also calls them and must not count as dismiss), the `UserDeclinedError` path in `GlobalDialog.tsx`, `setCancelledIdActionAtom` in `FullscreenWarningScreen/state.tsx`.
- **Privacy notes**: none beyond "Pop-ups shown".

### Pop-up call-to-action clicked

- **Status: planned**
- **Type**: journey `exposure`, `step = ctaClicked`.
- **Definition**: An explicit CTA press, once per exposure. A click is intent, not completion.
- **Where in the code**: banner `primaryButton.onPress` handlers (`DismissableMarketplaceBanner.tsx` already blocks repeats), the positive result in `GlobalDialog.tsx`, the `openUrl` button in `FullscreenWarning.tsx`. Product notification `actionLink` taps on the Notifications screen count as `ctaClicked` on the notification exposure journey of that campaign.
- **Privacy notes**: never the CTA target.

### Pop-up to contact import completed

- **Status: planned**
- **Type**: journey `exposure`, attribute `importEligible`, outcome `importCompleted`.
- **Definition**: Among exposed instances with `importEligible = true`, a successful import within 7 days. `ctaClicked` gives click-to-completion for free.
- **Where in the code**: exposure = `mpImportContacts` or `mpImportNewContacts`; completion = `submitContactsActionAtom` resolving `success`.
- **Privacy notes**: never the number of contacts or the reach.

### Pop-up to marketplace opened

- **Status: planned**
- **Type**: journey `exposure`, outcome `marketplaceLoaded`, attribute `exposedOnMarketplace`.
- **Definition**: A later successful main-marketplace load within 7 days, computed only for prompts shown off the marketplace (`exposedOnMarketplace = false`).
- **Where in the code**: the "Users who see at least one offer" load hook sets the flag on every open exposure journey.
- **Privacy notes**: boolean only.

### Pop-up to offer viewed

- **Status: deferred**. CSV decision: defer. Same optional `detailOpened` outcome as "Notification to offer viewed".

### Pop-up to offer created

- **Status: planned**
- **Type**: journey `exposure`, outcome `offerCreated`.
- **Definition**: A successful creation within 7 days after exposure, once per instance and prompt. Denominator = exposed cohort of that prompt.
- **Where in the code**: exposure `mpCreateOffer` (requires `!areThereAnyMyOffersAtom`); outcome `createOfferActionAtom` resolving.
- **Privacy notes**: no `offerType`, class, country or club info on the journey.

### Pop-up to chat opened

- **Status: planned**
- **Type**: journey `exposure`, outcome `chatInitiated`.
- **Definition**: A successful conversation initiation within 7 days. No prompt targets chat today; it is a generic outcome on every exposure.
- **Where in the code**: `sendRequestActionAtom` resolving.
- **Privacy notes**: boolean only.

### Pop-up to reactivation

- **Status: planned**
- **Type**: journey `exposure`, attribute `dormantAtBaseline`, outcome `offerCreated` or `chatInitiated`.
- **Definition**: Only instances core-dormant at exposure (30 days without a core action per `lastCoreActionAt`); a core action within 7 days is reactivation. Instances without a marker are not dormant, they are unknown, and are excluded.
- **Where in the code**: `dormantAtBaseline` evaluated at "Pop-ups shown" from the `lastCoreActionAt` marker.
- **Privacy notes**: dormant exposed instances are a small group; suppression applies per prompt and week.

### Conversion rate by pop-up

- **Status: planned**
- **Type**: derived on the dashboard from `exposure` journeys grouped by `type`; nothing new is collected.
- **Definition**: One primary outcome per prompt over the eligible exposed cohort after maturity, with counts and suppression, no lift claims. Mapping: `mpImportContacts` and `mpImportNewContacts` to `importCompleted`; `mpCreateOffer` to `offerCreated`; `mpEnableNotifications` and `dialogNotificationPermission` to `permissionGranted`; `warning` and the rest to `ctaClicked`. Donation invoice creation is not tracked.
- **Where in the code**: nothing beyond "Pop-ups shown", "Pop-ups dismissed", "Pop-up call-to-action clicked", "Pop-up to contact import completed", "Pop-up to marketplace opened", "Pop-up to offer viewed", "Pop-up to offer created", "Pop-up to chat opened", "Pop-up to reactivation".
- **Privacy notes**: none beyond the journey.
