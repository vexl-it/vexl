# vexl-website

The vexl.it marketing site: Next.js, ported 1:1 from Webflow. `README.md`
explains how the pages, layouts, content and CSP fit together. Read it before
changing anything beyond copy.

When the person you work with is not a developer, follow the
`updating-website` skill.

## Running

- `apps/vexl-website/scripts/setup.sh` prepares a laptop or a cloud dev
  environment: it installs only the website's part of the monorepo and the
  screenshot browser.
- `pnpm --filter vexl-website dev:prod-data` runs only the site on
  <http://localhost:3000>, reading blog posts and events from the production
  content-service. Start the local backend stack only to change content-service
  itself.
- Changes that alter what the site looks like go into the PR with before and
  after screenshots, desktop and mobile. The `screenshots` and
  `publish-screenshots` scripts take and host them; usage is at the top of each
  script.

## Content

- **Page text** lives in `content/copy/<locale>/<page>.json`. English and Czech
  always change together and keep the same keys; the copy tests check this. The
  values only take the formatting listed in the README's "Editing copy". New
  text follows the Vexl voice in `docs/brand-narrative/`.
- **Blog posts and community events** come from content-service and are edited
  in the backoffice (<https://backoffice.vexl.it>), not in this repo.
- **Legal documents** are `content/terms-privacy/*.html`.
- **Images, fonts and PDFs** are in `public/wf/`.

## Rules

- `src/styles/webflow.css` is Webflow's export, vendored as is. Build new
  sections from its existing classes; put the few styles it lacks in
  `src/styles/site.css`.
- The CSP in `src/contentSecurityPolicy.ts` blocks scripts, images, frames and
  connections from any other origin. A new origin (analytics, an embed, a
  hosted font) means visitors' browsers talk to a third party, which is a
  privacy decision: raise it with the developers before adding it to the
  policy.
- Pages render per request because of the CSP nonce. HTML must stay uncached
  at Cloudflare, otherwise one visitor's nonce is served to everyone.

## Verification

From the repo root, run `typecheck`, `lint`, `format` and `test` with
`pnpm --filter vexl-website <script>`. If `format` fails, run `format:fix` and
re-run it. Work is done when all four pass.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
