# @vexl-next/showcase

Marketing page that replays Vexl features inside phone mockups. Every screen is built from the real `@vexl-next/ui` components, rendered on the web through react-native-web. Visitors switch between three demos: a full trade (default), identity reveal and nearby offers over Bluetooth.

## Run

```sh
pnpm --filter @vexl-next/showcase dev     # http://localhost:5173
pnpm --filter @vexl-next/showcase build   # static site in apps/showcase/dist
```

## How web support works

`vite.config.ts` lets the native-only ui package run in a browser:

- `react-native` is aliased to `react-native-web`.
- `.web.*` files resolve before plain ones, both in Vite and in esbuild's dependency pre-bundling.
- A small plugin turns packages/ui's Metro-style `require('./font.otf')` asset calls into imports.
- `__DEV__`, `global`, `TAMAGUI_TARGET` and `EXPO_OS` are defined at build time.
- `build.commonjsOptions.transformMixedEsModules` handles Reanimated's web build, which loads react-native-web internals through `require()`. Without it, animated styles throw in production builds.

`src/fonts.css` registers the ui fonts twice: under the Tamagui families (`TTSatoshi`, `MonumentExtended`) and under the native face names (`TTSatoshi500`, ...) that some components put in a raw `fontFamily` style.

`main.tsx` wraps the page in `KeyboardProvider`, because `Screen` uses react-native-keyboard-controller and throws without it.

`vite.config.ts` also drops the internal `forwardedRef` prop that Reanimated passes on to Tamagui components, which would otherwise reach the DOM and make React warn.

When a ui component needs a different implementation on the web, add a platform-split `Component.web.tsx` next to it in packages/ui. Prefer a fix that works on both platforms, and never change native behavior. For example, `DialogModal.web.tsx` makes ui dialogs cover the phone mockup instead of the whole page.

## Demos

`src/page/DemoSection.tsx` holds the switcher and each demo's title. A demo is a `Demo` object (`src/demos/shared/DemoPlayer.tsx`): captioned steps with start times, every moment the screens change, which phone to show on narrow screens, and a function rendering both phones at a playhead.

`src/demos/shared` is the infrastructure and the scenes the demos share:

- `DemoPlayer.tsx`: the phone pair, the step captions and Replay. It replays when the demo scrolls into view, and clicking a caption remounts the timeline at that step's start. On narrow screens only the focused phone shows. A demo can also draw `halos` around and behind a phone, like the nearby demo's Bluetooth waves.
- `playback.ts`: `usePlayhead(times, startAt)` advances one playhead through the times after `startAt`, plus typing helpers. With reduced motion the playhead stays put: the end, or the step clicked.
- `PhoneScreens.tsx`: the stack of app screens open at the playhead, with push and sheet transitions.
- `PhoneFrame.tsx`: lays a screen out at 390×844, scales it into a device bezel, and adds a fake status bar and safe-area insets.
- `Tap.tsx`: a fake touch over a press target. `chat.tsx`: chat header, bubbles, the anonymous avatars and the pieces of a chat waiting for its request to be accepted. `checklist.tsx`: the trade checklist hub, the date and time slots and the page layout of checklist screens.
- `MarketplaceScene.tsx`, `OfferScenes.tsx` (offer detail, send a message) and `PushNotification.tsx`: app screens filled with each demo's fictional offers.

Each demo folder has a `script.ts` (cues in ms, typing, fictional data, which screens are open when) and presentational scenes that read the cues through `at(cue)`.

Measurements based on `onLayout` include the phone's scale transform on the web, because Tamagui and react-native-web measure with `getBoundingClientRect()`. `unscaledLayout.ts` reports unscaled rects inside the phone viewport, and `PhoneFrame` mounts the screens only once their scale is known.

## App animation (`/app-animation-1`)

One phone walks through the whole app for marketing reels: phone number, contacts, browsing offers, an optional new offer, a request, the chat, the trade checklist, an optional "meeting successful" screen with confetti and the Vexl end card. `main.tsx` picks the page from the path; `public/vercel.json` rewrites the path to `index.html` on Vercel.

- `src/demos/appAnimation/config.ts`: everything the page lets people edit, as an `effect/Schema`, with fictional defaults. `src/page/appAnimation/useStoredConfig.ts` keeps edits in localStorage.
- `src/demos/appAnimation/script.ts`: `buildScript(config)` lays the cues out one after another, so typed text and the optional sections retime everything after them. Skipped sections get `Infinity` cues.
- `src/page/appAnimation`: the page, its playback (`?at=<ms>` freezes a frame), the reel frame and the settings panel. Focusing a setting holds the animation at the end of its step.
- `recordElement.ts`: the mp4 download. The person shares the tab (Chrome or Edge), Region Capture crops it to the stage, a canvas scales it to 1080×1920 (reel) or 1080×2338 (bare screen) and `MediaRecorder` encodes it in real time.
