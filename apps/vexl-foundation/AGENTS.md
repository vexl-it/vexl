# vexl-foundation

The vexl.foundation site: Next.js, ported 1:1 from Webflow. `README.md`
explains how the page, copy and CSP fit together. Read it before changing
anything beyond copy.

When the person you work with is not a developer, follow the
`updating-website` skill.

## Running

- `packages/website-utils/scripts/setup.sh vexl-foundation` prepares a laptop or a
  cloud dev environment: it installs only vexl-foundation's part of the monorepo and the
  screenshot browser.
- `pnpm --filter vexl-foundation dev` runs the site on <http://localhost:3000>.
  It has no backend dependency.
- Changes that alter what the site looks like go into the PR with before and
  after screenshots, desktop and mobile. The `screenshots` and
  `publish-screenshots` scripts take and host them; usage is at the top of each
  script in `packages/website-utils/scripts`.

## Content

- **Page text** lives in `content/copy/<page>.json` (`home.json` and
  `not-found.json`). The site is English-only. Values only take the formatting
  listed in the README's "Editing copy". New text follows the Vexl voice in
  `docs/brand-narrative/`.
- **Images and fonts** are in `public/wf/`.

## Rules

- `src/styles/webflow.css` is Webflow's export, vendored as is. Build new
  sections from its existing classes; put the few styles it lacks in
  `src/styles/site.css`.
- The CSP (`packages/website-utils/src/securityHeaders.ts`, plus the origins
  `proxy.ts` adds) blocks scripts, images, frames and connections from any
  other origin. A new origin (analytics, an embed, a
  hosted font) means visitors' browsers talk to a third party, which is a
  privacy decision: raise it with the developers before adding it to the
  policy.
- Pages render per request because of the CSP nonce. HTML must stay uncached
  at Cloudflare, otherwise one visitor's nonce is served to everyone.

## Verification

From the repo root, run `typecheck`, `lint`, `format` and `test` with
`pnpm --filter vexl-foundation <script>`. If `format` fails, run `format:fix`
and re-run it. Work is done when all four pass.
