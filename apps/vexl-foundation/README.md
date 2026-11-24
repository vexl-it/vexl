# Vexl Foundation website

The vexl.foundation site, ported 1:1 from Webflow to Next.js. The markup, class
names, copy and images are the live Webflow site's. The styling is Webflow's
exported CSS (`src/styles/webflow.css`), vendored as is.

## Run

The site is a single English page with no backend dependencies.

```sh
pnpm --filter vexl-foundation dev
```

On a new machine or cloud environment,
`packages/website-utils/scripts/setup.sh vexl-foundation` installs only
vexl-foundation's part of the monorepo and the browser the `screenshots` script
uses.

```sh
pnpm --filter vexl-foundation build
pnpm --filter vexl-foundation start
pnpm --filter vexl-foundation test    # copy files and CSP
```

The Docker image (`apps/vexl-foundation/Dockerfile`) runs the standalone
Next.js server on port 3000.

## How it fits together

- **Body classes.** Webflow styles the homepage through `.body` (black
  background) and leaves the 404 page unclassed (white background).
  `app/(home)/layout.tsx` renders `<SiteDocument bodyClassName="body">`, while
  `app/not-found.tsx` renders `<SiteDocument>` without a body class.
  `app/layout.tsx` only exists so unknown URLs get `app/not-found.tsx`.
- **Sections.** `app/(home)/page.tsx` is a server component composed from the
  section views in `src/views/home/`. There is no client-side JavaScript beyond
  Next.js itself (and the dev-only copy editor under `next dev`).
- **Links** are plain `<a>` tags, matching Webflow.
- **Content Security Policy.** `proxy.ts` runs on every request and sends the
  two policies from `packages/website-utils/src/securityHeaders.ts`. One carries a fresh nonce,
  which Next puts on its inline scripts, so every page renders per request. The
  other only allows scripts from our origin, because Next puts the nonce on
  external `<Script>`s too. Scripts, images, frames and connections to any
  other origin are blocked, so a new third-party embed needs an entry there.

## Content

- `content/copy/home.json` and `content/copy/not-found.json`: every text on the
  site.
- `public/wf/`: every image and font from the Webflow CDN.

## Editing copy

Every text on the site comes from `content/copy/<page>.json`. Keys are stable
names such as `hero.headline`. A value may use `**bold**`, `*italic*`,
`[text](https://…)` (also `mailto:` and `/path` links) and new lines, nothing
else.

To change copy:

1. Start the site with `pnpm --filter vexl-foundation dev`, then open
   <http://localhost:3000>.
2. Click **Edit copy** in the bottom-right corner. Editable text gets an
   outline when you hover it. Alt-click uses the page as usual.
3. Click a text. The panel shows its key and value. Edit it and click **Save**.
   The page reloads with the change.
4. Page title and description aren't on the page: open **Edits** and pick them
   under **Page meta**. The same list shows unsaved edits and everything you
   saved in this tab.
5. Check what changed with `git diff apps/vexl-foundation/content/copy`, then
   commit and open a PR. Without git, ask an agent to open it: the
   `updating-website` skill takes it from there.

The editor and its save action only exist under `next dev`; `next build` leaves
them out. Adding or removing keys, and the page structure around the copy, is a
code change.
