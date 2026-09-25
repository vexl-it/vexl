# Acquisition

## Merged

| Duplicate                                                       | Canonical                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------- |
| "Activation of users from events"                               | "Activation by acquisition source" (deferred)                  |
| "Activation of users from Clubs"                                | "Club to main marketplace activation rate" (`clubs.md`)        |
| "Onboarding completion rate"                                    | "Onboarding completion and onboarding churn"                   |
| "Activation rate by event by channel or source"                 | "Time from registration to activation"                         |
| "Time from registration to first meaningful marketplace action" | "Time from registration to activation"                         |
| "Percentage of registrations that reach activation"             | "Time from registration to activation"                         |
| "Download to registration drop-off"                             | "Onboarding completion and onboarding churn" (`churn.md` stub) |
| "Onboarding drop-off by step"                                   | "Onboarding completion and onboarding churn" (`churn.md` stub) |
| "Registration to activation drop-off"                           | "Time from registration to activation" (`churn.md` stub)       |

## Category summary

- Two journeys cover the category. `onboarding` (first open to `onboardingFinished`, 7 days) gives the setup funnel and its drop-off ("Onboarding completion and onboarding churn", "Time from download to registration"). `registrationCohort` (registration to day 31) gives activation and its latency ("Time from registration to activation", "First meaningful core marketplace action") and the D1/D7/D30 bits of `retention.md`. Both are defined in `docs/analytics/definitions-index.md`.
- "Registrations" registrations by country are backend (`USER_LOGGED_IN`). The journeys carry country as a row column like every other definition; the dashboard suppresses small groups.
- Acquisition source ("Registrations by acquisition source", "Activation by acquisition source", "Number of new users from events", "Activation of users from events") is deferred: no source concept exists (Q9).
- "App downloads" is store-console data, nothing to build.
- Signal sites: `firstOpenAt` marker written on first mount of `App` while `sessionAtom` is `loggedOut`; login screens in `apps/mobile/src/components/LoginFlow/`; registration success in `handleUserCreationActionAtom` (`finishLoginActionAtom.ts`); post-login steps in `apps/mobile/src/components/PostLoginFlow/` and `apps/mobile/src/state/postLoginOnboarding.ts`; activation at `createOfferActionAtom` and `sendRequestActionAtom` (classes from `coreAction.ts`).

### App downloads

- **Status: external**. App Store Connect and Google Play Console first-acquisition reports, by week and by the region the store exposes. Nothing in the app can see a download; the nearest in-app proxy is first opens (`onboarding` journeys started). Never join store data to app data.

### Registrations

- **Status: planned**
- **Type**: backend (`USER_LOGGED_IN` with `countryPrefix`, `numberExists`) for counts by country; the `registrationCohort` journey count is the participating denominator for "Time from registration to activation" and "D1 retention", "D7 retention", "D30 retention".
- **Definition**: Registration = successful phone verification plus account creation, not phone submission. `numberExists = true` is a re-login from a new device or without deletion and is shown separately. No city.
- **Where in the code**: backend `reportUserLoggedIn` in `apps/contact-service/src/metrics.ts`, called from `apps/contact-service/src/routes/user/createUser.ts`. Client success point `handleUserCreationActionAtom` in `apps/mobile/src/components/LoginFlow/atoms/finishLoginActionAtom.ts` (`set(sessionAtom, O.some(session))`); re-login is known client-side from `contactApi.checkUserExists`.
- **Privacy notes**: the backend metric already carries country plus an exact timestamp, an existing exposure. The client journey's initial upload is delayed to the next app start so it cannot be timed against that row.

### Registrations by acquisition source

- **Status: deferred**. Open: Q9.
- **Where in the code**: no signal. No campaign, referral, UTM or install-referrer concept; deep links (`apps/mobile/src/utils/deepLinks/domain.ts`) carry no source and are handled only after login. Would become a `source` enum on the `onboarding` journey.

### Onboarding completion and onboarding churn

- **Status: planned**.
- **Type**: journey `onboarding`, lifetime 7 days from first open, terminal `onboardingFinished`, day precision, country stored, initial upload at next app start.
- **Fields**: `step` (`opened`, `intro`, `phoneSubmitted`, `codeVerified`, `registered`, `contactsImport`, `notifications`, `onboardingFinished`), `reLogin` (from `checkUserExists`), `contactsImport` (`success`, `zero`, `skipped`, `denied`, `error`), `notifications` (`granted`, `skipped`), `openToRegistration` (`DurationBucket`, "Time from download to registration").
- **Definition**: Enrol at first open, replace the state at each completed milestone. After the cohort matures (7 days plus grace) the dashboard shows the share that never advanced past each step; a journey still at `phoneSubmitted` is the drop-off readout. Account setup (`registered`) and contact import are separate milestones, and an import skip is not an import failure. A record that stops updating is "not observed", never confirmed abandonment. Steps after the lifetime are ignored; a registration weeks after first open starts no new onboarding journey but does start a `registrationCohort`.
- **Where in the code**: `Intro1Screen` to `VerificationCodeScreen` in `apps/mobile/src/components/LoginFlow/components/`; `initPhoneVerificationAtom` (`phoneSubmitted`), `verifyPhoneNumberAtom` (`codeVerified`), `handleUserCreationActionAtom` (`registered`). Post-login: `completePostLoginFlowScreenActionAtom` and `finishPostLoginFlowActionAtom` in `apps/mobile/src/state/postLoginOnboarding.ts`; import outcome from the `submitContactsActionAtom` result in `ContactsImportScreen.tsx` (skip = the `secondaryButton`); notification outcome in `NotificationSetupScreen.tsx` (`requestPermissions` vs skip). Pre-login uploads use the session-free client (system.md "Club chats opened").
- **Privacy notes**: durations only as `DurationBucket`. Instances that registered before the release have no journey and are not back-filled.

### Activation by acquisition source

- **Status: deferred**. Open: Q9.
- **Where in the code**: activation exists ("Time from registration to activation"); source does not ("Registrations by acquisition source"). Would become the `source` slice of `registrationCohort`.

### Number of new users from events

- **Status: deferred**. Open: Q9.
- **Where in the code**: no event code in the login flow; the `join-club` deep link is processed after onboarding and a club is not an event. Interim proxy without any new input: `clubJoinCohort` started within the registration week ("Returning to a Club").

### Activation of users from events

Merged into "Activation by acquisition source" (deferred, Q9). Dashboard label: the `event` slice of the activation-by-source chart, pooled category by default.

### Activation of users from Clubs

Merged into "Club to main marketplace activation rate" (`clubs.md`). Dashboard label: "main-marketplace activation within 1, 7 and 30 days of first club join, among joiners not yet activated".

### Time from download to registration

- **Status: planned**.
- **Type**: journey `onboarding`, field `openToRegistration` (`DurationBucket`) written with the `registered` step.
- **Definition**: Replaced by first-app-open to successful-registration, over observed registrants only. Nothing is implied about download-to-open.
- **Where in the code**: `firstOpenAt` marker (new) and `registeredAt` marker written in `handleUserCreationActionAtom`; bucket on device. A reinstall between first open and registration restarts the clock; an app update does not.
- **Privacy notes**: bucket only.

### Time from registration to activation

- **Status: planned**.
- **Type**: journey `registrationCohort`, lifetime 31 days from registration, week precision, country stored, initial upload at next app start.
- **Fields**: `activatedBy` (`offer`, `request`), `activationClass` (`main`, `both`, `club`), `registrationToActivation` (`DaysBucket`), plus `d1`, `d7`, `d30` (specified in `retention.md` "D1 retention", "D7 retention", "D30 retention").
- **Definition**: Enrol at registration. The first core action writes `activatedBy`, `activationClass` and the latency bucket once; `d0`, `d1`, `d2To7` give the 7-day rate and `d8To30` the 30-day rate. Records without an activation field at maturity are the "no observed activation" share ("Registration to activation drop-off"). Latency describes activators only. Also the canonical home of "First meaningful core marketplace action" (the activation milestone), "Time from registration to first meaningful marketplace action" (latency histogram) and "Percentage of registrations that reach activation" (7 and 30 day rates), and, with `activationCohort`, of "Time from registration to churn".
- **Where in the code**: enrolment in `handleUserCreationActionAtom`; `activatedAt` marker written once at the success of `createOfferActionAtom` (`apps/mobile/src/state/marketplace/atoms/createOfferActionAtom.ts`, class from `intendedClubs`) or `sendRequestActionAtom` (`apps/mobile/src/state/chat/atoms/sendRequestActionAtom.ts`, class from the offer origin, re-requests and note requests excluded). The existing partial flags `postedFirstOfferAtom` and `idsOfRequestedOffersAtom` are not reused.
- **Privacy notes**: enums and booleans only; long-lived journey rules apply.
