# Vexl website

The vexl.it marketing site, ported 1:1 from Webflow to Next.js. The markup,
class names, copy and images are the live Webflow site's. The styling is
Webflow's exported CSS (`src/styles/webflow.css`), vendored as is.

## Run

```sh
pnpm --filter vexl-website dev     # http://localhost:3000
pnpm --filter vexl-website build   # every page is prerendered
pnpm --filter vexl-website start
```

The Docker image (`apps/vexl-website/Dockerfile`) runs the standalone Next.js
server on port 3000.

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
  in the browser under `/cs`.

## Content

- `content/blog/<slug>.md`: one post per file. The frontmatter (validated in
  `src/content/blog.ts`) holds the listing order and the locales the post is
  published in. Post images are in `public/wf/cms/`.
- `content/faq/<locale>.md`: `## Section {#id}`, then `### Question` cards.
- `content/events.json`: community events. Events dated on or after the build
  date are listed as upcoming, so rebuild to move them to past.
- `content/terms-privacy/*.html`: the legal documents.
- `public/wf/`: every image, font and PDF from the Webflow CDN.

The old Webflow pagination URLs (`/blog?27a9a69d_page=2`,
`/community?534aadfb_page=2`) redirect to `/blog/page/2` and
`/community/page/2`.

## Analytics

Fathom (cookieless) is the only third-party script. It only reports from
`vexl.it` (`data-included-domains`), so previews and local runs send nothing.
