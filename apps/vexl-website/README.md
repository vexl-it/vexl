# Vexl website

The vexl.it marketing site, ported 1:1 from Webflow to Next.js. The markup,
class names, copy and images are the live Webflow site's. The styling is
Webflow's exported CSS (`src/styles/webflow.css`), vendored as is.

## Run

Blog posts and community events come from content-service, so the site needs
`CONTENT_SERVICE_URL` at runtime. The build doesn't call it.

Against the local stack (`tooling/dev`):

```sh
pnpm dev:backend --only content-service   # http://localhost:3009
CONTENT_SERVICE_URL=http://localhost:3009 pnpm --filter vexl-website dev
```

Against the production content-service (no backend needed):

```sh
pnpm --filter vexl-website dev:prod-data
```

On a new machine or cloud environment, `scripts/setup.sh` installs only the
website's part of the monorepo and the browser the `screenshots` script uses.

```sh
pnpm --filter vexl-website build   # no content-service needed
CONTENT_SERVICE_URL=... pnpm --filter vexl-website start
pnpm --filter vexl-website test    # copy files and post HTML sanitizer
```

The Docker image (`apps/vexl-website/Dockerfile`) runs the standalone Next.js
server on port 3000. In the cluster, set
`CONTENT_SERVICE_URL=http://content.vexl.svc.cluster.local:3000`.

## Languages

English is served at the root (`/faq`) and Czech under `/cs` (`/cs/faq`). The
rewrites in `next.config.js` map both onto `app/(group)/[locale]`.

The page copy lives in `content/copy/<locale>/<page>.json` (see
[Editing copy](#editing-copy)). The Czech text comes from the live site, which
Weglot translated.

## How it fits together

- **Body classes.** Webflow styles some pages through the `<body>` class, so
  each route group is its own root layout: `(default)` has no class,
  `(white-bg)` is the download pages, `(body-light)` is blog posts.
  `app/layout.tsx` only exists so unknown URLs get `app/not-found.tsx`.
- **Shared pieces.** `src/components/` holds the navbar, language dropdown,
  footer, the `global-styles` embed some pages include, and the smooth anchor
  scrolling webflow.js used to do.
- **Pages.** `app/**/page.tsx` are server components. Page sections live in
  `src/views/<page>/`. The few interactive parts are small client components:
  the mobile menu, the FAQ accordion, the homepage's line reveal (GSAP +
  SplitType) and physics cards (matter.js).
- **Links** are plain `<a>` tags, so every navigation is a full page load like
  on Webflow.
- **404.** Every unknown URL lands on `app/not-found.tsx`. It switches to Czech
  in the browser under `/cs`. Next sends a JS-only shell when a request-time
  page calls `notFound()`, so `proxy.ts` rewrites unknown post slugs and page
  numbers to an unmatched URL before they reach their route.
- **Content Security Policy.** `proxy.ts` runs on every request and sends
  the two policies from `src/contentSecurityPolicy.ts`. One carries a fresh
  nonce, which Next puts on its inline scripts, so every page renders per
  request. The other only allows scripts from our origin, because Next puts
  the nonce on external `<Script>`s too. Scripts, images, frames and
  connections to any other origin are blocked, so a new third-party embed
  needs an entry there.

## Content

- **Blog posts and events** come from content-service's public
  `/content/website/blog-posts` and `/content/website/events` endpoints
  (`src/content/contentService.ts`), edited in the backoffice. Responses are
  cached in memory for a minute. Posts are listed newest first by
  `publishedAt`, and a post is on the Czech site when it has Czech content.
  Events starting today or later (Prague time) are upcoming.
- **Post bodies** are HTML. `src/content/sanitizePostHtml.ts` parses them and
  keeps only an allowlist of tags and attributes before they are rendered,
  because anyone with an editor token can store any HTML.
- `content/copy/<locale>/<page>.json`: every text on the pages, the FAQ
  included.
- `content/terms-privacy/*.html`: the legal documents. They aren't in the copy
  files; change them through an agent.
- `public/wf/`: every image, font and PDF from the Webflow CDN. Post and event
  images are on `https://resources.vexl.it`.

The old Webflow pagination URLs (`/blog?27a9a69d_page=2`,
`/community?534aadfb_page=2`) redirect to `/blog/page/2` and
`/community/page/2`.

## Editing copy

Every text on the site comes from `content/copy/<locale>/<page>.json`: one file
per page and language, plus `shared.json` for the navbar and footer. Keys are
stable names such as `hero.headline`, and English and Czech always have the
same keys. A value may use `**bold**`, `*italic*`, `[text](https://…)` (also
`mailto:` and `/path` links) and new lines, nothing else.

To change copy:

1. Start the site with `pnpm --filter vexl-website dev:prod-data`, then open <http://localhost:3000>.
2. Click **Edit copy** in the bottom-right corner. Editable text gets an
   outline when you hover it. Alt-click uses the page as usual, e.g. to open an
   FAQ answer.
3. Click a text. The panel shows its key with the English and Czech value side
   by side, whichever language you are viewing. Change both and click **Save
   both languages**. The page reloads with the change.
4. Page titles and descriptions aren't on the page: open **Edits** and pick
   them under **Page meta**. The same list shows unsaved edits and everything
   you saved in this tab.
5. Check what changed with `git diff apps/vexl-website/content/copy`, then
   commit and open a PR. Without git, ask an agent to open it: the
   `updating-website` skill takes it from there.

The editor and its save action only exist under `next dev`; `next build`
leaves them out. Adding or removing keys, and the page structure around the
copy, is a code change.
