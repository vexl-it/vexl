# Freedom Store website

The freedomstore.io site, ported 1:1 from Webflow to Next.js. The markup, class
names, copy, video and images come from the live Webflow site. The styling is
Webflow's exported CSS (`src/styles/webflow.css`), vendored as is, with hover
and layout additions in `src/styles/site.css`.

## Run

The site is English-only (`/` and `/apps`) with no backend dependencies.

```sh
pnpm --filter freedomstore dev
```

On a new machine or cloud environment,
`packages/website-utils/scripts/setup.sh freedomstore` installs only
freedomstore's part of the monorepo and the browser the `screenshots` script
uses.

```sh
pnpm --filter freedomstore build
pnpm --filter freedomstore start
pnpm --filter freedomstore test    # copy files
```

The Docker image (`apps/freedomstore/Dockerfile`) runs the standalone Next.js
server on port 3000.

## How it fits together

- **Pages.** `app/(site)/page.tsx` renders `/` (hero, app marquee, guide,
  NitroPhone banner, values, developers footer) and `app/(site)/apps/page.tsx`
  renders `/apps` (all apps grid plus the shared guide, banner and footer).
  `app/not-found.tsx` handles unknown URLs.
- **Animations.** `src/components/ScrollEffects.tsx` bundles GSAP
  (`ScrollTrigger`, `SplitText`, `ScrollToPlugin`) directly so the scroll
  progress bar, marquee, sticky values reveal, hero scale and anchor scrolling
  run without loading scripts from a third-party CDN. Button hover transitions
  are pure CSS in `src/styles/site.css`.
- **Links** are plain `<a>` tags, matching Webflow.
- **Content Security Policy.** `proxy.ts` runs on every request and sends the
  two policies from `packages/website-utils/src/securityHeaders.ts`. One carries
  a fresh nonce, which Next puts on its inline scripts, so every page renders
  per request. The other only allows scripts from our origin, because Next puts
  the nonce on external `<Script>`s too. Scripts, images, frames and connections
  to any other origin are blocked, so a new third-party embed needs an entry
  there. Fathom analytics (`FathomAnalytics.tsx` in `packages/website-utils`) is
  the one already allowed.

## Content

- `content/copy/shared.json`, `content/copy/home.json`,
  `content/copy/apps.json` and `content/copy/not-found.json`: every text on the
  site.
- `public/wf/`: every image, video and font from the Webflow CDN.

## Editing copy

Every text on the site comes from `content/copy/<page>.json`. Keys are stable
names such as `hero.headline`. A value may use `**bold**`, `*italic*`,
`[text](https://…)` (also `mailto:` and `/path` links) and new lines, nothing
else.

To change copy:

1. Start the site with `pnpm --filter freedomstore dev`, then open
   <http://localhost:3000>.
2. Click **Edit copy** in the bottom-right corner. Editable text gets an
   outline when you hover it. Alt-click uses the page as usual.
3. Click a text. The panel shows its key and value. Edit it and click **Save**.
   The page reloads with the change.
4. Page title and description aren't on the page: open **Edits** and pick them
   under **Page meta**. The same list shows unsaved edits and everything you
   saved in this tab.
5. Check what changed with `git diff apps/freedomstore/content/copy`, then
   commit and open a PR. Without git, ask an agent to open it: the
   `updating-website` skill takes it from there.

The editor and its save action only exist under `next dev`; `next build` leaves
them out. Adding or removing keys, and the page structure around the copy, is a
code change.
