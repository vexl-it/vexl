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

Against the public content-service:

```sh
CONTENT_SERVICE_URL=https://content.vexl.it pnpm --filter vexl-website dev
```

```sh
pnpm --filter vexl-website build   # no content-service needed
CONTENT_SERVICE_URL=... pnpm --filter vexl-website start
pnpm --filter vexl-website test    # post HTML sanitizer
```

The Docker image (`apps/vexl-website/Dockerfile`) runs the standalone Next.js
server on port 3000. In the cluster, set
`CONTENT_SERVICE_URL=http://content.vexl.svc.cluster.local:3000`.

## Languages

English is served at the root (`/faq`) and Czech under `/cs` (`/cs/faq`). The
rewrites in `next.config.js` map both onto `app/(group)/[locale]`.

Copy lives next to each page in `src/i18n/<page>.ts`, as
`localized({en, cs})`. The Czech copy must have the same shape as the English
one, so a missing key fails typecheck. The Czech text comes from the live site,
which Weglot translated.

## How it fits together

- **Body classes.** Webflow styles some pages through the `<body>` class, so
  each route group is its own root layout: `(default)` has no class,
  `(white-bg)` is the download pages, `(body-light)` is blog posts.
  `app/layout.tsx` only exists so unknown URLs get the prerendered
  `app/not-found.tsx`.
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
- `content/faq/<locale>.md`: `## Section {#id}`, then `### Question` cards.
- `content/terms-privacy/*.html`: the legal documents.
- `public/wf/`: every image, font and PDF from the Webflow CDN. Post and event
  images are on `https://resources.vexl.it`.

The old Webflow pagination URLs (`/blog?27a9a69d_page=2`,
`/community?534aadfb_page=2`) redirect to `/blog/page/2` and
`/community/page/2`.

## Analytics

Fathom (cookieless) is the only third-party script. It only reports from
`vexl.it` (`data-included-domains`), so previews and local runs send nothing.
