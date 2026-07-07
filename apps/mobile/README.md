# Vexl mobile app

**Work in progress**

This repository contains code for the Vexl mobile app. The app is built using React Native and Expo.

## How to run the app

1. Clone the repository
2. Setup expo environment on your computer [See this guide](https://docs.expo.dev/get-started/installation/).
3. Build and install developer build on your phone or emulator [See this guide](https://docs.expo.dev/development/create-development-builds).
4. Launch the app on your phone or emulator.
5. Run `pnpm install` to install dependencies.
6. Run `pnpm --filter @vexl-next/mobile-app start` to start the development server.
7. Open the app and select your computer as a host to download the js bundle from.

## PR & main previews

Every PR gets a comment with a QR code (published by
`.github/workflows/pr-preview.yaml` as an EAS Update on channel
`pr-<number>`). To try the PR:

1. Install the regular staging app (staging TestFlight or the staging APK).
2. Open Account → Scan QR code and scan the QR from the PR comment (or open
   the link from the comment on your phone).
3. Confirm — the app downloads the PR's JS bundle and restarts into it. The
   app keeps following the PR channel until you clear it: tap the version
   footer in Account to open the debug screen, then "Clear preview".

Every push to main is published the same way to channel `main`
(`.github/workflows/main-preview.yaml`) — load it from the debug screen via
"Load latest main bundle".

A preview only loads if the staging build's runtime fingerprint matches the
published bundle — a change to native code (dependencies, config plugins,
native config) needs a new staging build first. The mechanism lives in
`src/utils/prPreview`.

Preview links use `https://staging.app.vexl.it/...`, a domain registered
only by non-prod builds, so a tap can never open the prod app. Scanning from
inside the app always works; for _tapped_ links (and OS camera scans) to
open the staging app directly, that subdomain must serve
`/.well-known/apple-app-site-association` (appID
`KQNTW88PVA.it.vexl.nextstaging`) and `/.well-known/assetlinks.json` (package
`it.vexl.nextstaging`) — until then a tap just opens the browser.

## E2E Testing

This app uses Maestro framework for UI testing, to install the tool follow [this guide](https://maestro.mobile.dev/getting-started/installing-maestro) and then just run `pnpm --filter @vexl-next/mobile-app start` and in new terminal window `pnpm --filter @vexl-next/mobile-app e2e-test`
