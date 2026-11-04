# Vexl website

The vexl.it marketing site. It's a Next.js app built from `@vexl-next/ui`
components, rendered on the web through react-native-web.

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
rewrites and redirects in `next.config.js` map both onto `app/[locale]`.

- UI copy: `src/i18n/en.ts` and `src/i18n/cs.ts`. The Czech file is typed
  against the English one, so a missing key fails typecheck.
- Blog posts and Terms & Privacy exist only in English. Czech pages show them
  with a note saying so.

## Content

Content stays in the repo until there is a CMS.

- `content/blog/<slug>.md`: one post per file. Frontmatter is `title`, `date`,
  `author`, `summary`, plus optional `image` and `featured`. The slug becomes
  `/post/<slug>`. Images go in `public/blog/<slug>/`.
- `content/faq/<locale>.md`: `## Category`, then `### Question` with the answer
  in Markdown underneath.
- `content/events.json`: community events. Events dated on or after the build
  date are listed as upcoming, so rebuild to move them to past.
- `content/terms-privacy.md`: Terms & Privacy.

## How it fits together

- `app/[locale]/**/page.tsx` are server components. They read content and pass
  plain data to client views in `src/views`.
- Markdown is parsed on the server (`src/components/Markdown.tsx`) into the
  client elements in `MarkdownElements.tsx`, so the parser isn't shipped to
  the browser.
- Links are Next `<Link>` anchors wrapped around `@vexl-next/ui` visuals
  (`SiteLink`). The visual gets `role="none"`, so the anchor is the only
  interactive element.
- `next.config.js` aliases `react-native` to `react-native-web`, prefers
  `.web.*` files, and runs the Reanimated worklets Babel plugin on
  `packages/ui` sources.

## Analytics

Fathom (cookieless) is the only third-party script. It only reports from
`vexl.it` (`data-included-domains`), so previews and local runs send nothing.
