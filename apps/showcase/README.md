# @vexl-next/showcase

Marketing page that replays Vexl features inside phone mockups. Every screen is built from the real `@vexl-next/ui` components, rendered on the web through react-native-web. Visitors switch between two demos: a full trade (default) and identity reveal.

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

`src/demos/shared` is the infrastructure both demos use:

- `DemoPlayer.tsx`: the phone pair, the step captions and Replay. It replays when the demo scrolls into view, and clicking a caption remounts the timeline at that step's start. On narrow screens only the focused phone shows.
- `playback.ts`: `usePlayhead(times, startAt)` advances one playhead through the times after `startAt`, plus typing helpers. With reduced motion the playhead stays put: the end, or the step clicked.
- `PhoneScreens.tsx`: the stack of app screens open at the playhead, with push and sheet transitions.
- `PhoneFrame.tsx`: lays a screen out at 390×844, scales it into a device bezel, and adds a fake status bar and safe-area insets.
- `Tap.tsx`: a fake touch over a press target. `chat.tsx`: chat header, bubbles and the anonymous avatars.

Each demo folder has a `script.ts` (cues in ms, typing, fictional data, which screens are open when) and presentational scenes that read the cues through `at(cue)`.

Measurements based on `onLayout` include the phone's scale transform on the web, because Tamagui and react-native-web measure with `getBoundingClientRect()`. `unscaledLayout.ts` reports unscaled rects inside the phone viewport, and `PhoneFrame` mounts the screens only once their scale is known.
