---
name: updating-website
description: Takes a non-developer from a website change request to a pull request with before/after screenshots, editing only apps/vexl-website (vexl.it) or apps/vexl-foundation (vexl.foundation). Use when someone says they are not a developer and want to update either website.
---

# Updating a website with a non-developer

The person knows what the site should say and look like. You handle the code,
git and GitHub. Talk about pages, sections, texts and images, and show them the
running site rather than code or diffs.

This skill covers two sites — pick the one they want to change (`<app>` below),
read `apps/<app>/AGENTS.md` first (it applies in full), and keep your edits
inside `apps/<app>/`:

| Site              | `<app>`           | Dev command                                | Languages                     |
| ----------------- | ----------------- | ------------------------------------------ | ----------------------------- |
| `vexl.it`         | `vexl-website`    | `pnpm --filter vexl-website dev:prod-data` | English (`/`) + Czech (`/cs`) |
| `vexl.foundation` | `vexl-foundation` | `pnpm --filter vexl-foundation dev`        | English only (`/`)            |

## Steps

1. **Understand the change.** If they haven't said which site or what they want,
   ask: which site (`vexl.it` or `vexl.foundation`), which page/section, what
   should change, and the new text. Done when you can name the site and every
   page and section that changes. Two kinds of request go elsewhere:
   - **Blog posts and community events** (on `vexl.it`) are edited in the
     backoffice (<https://backoffice.vexl.it>). Tell them so, and stop unless
     something else on the site also changes.
   - **Changes beyond the website**: new data or features from the backend,
     the backoffice or the app, or a third-party script, embed or analytics
     tool (see the CSP rule in `apps/<app>/AGENTS.md`). Tell them a developer
     has to be involved and offer to build the website side anyway. If they
     continue, the PR goes to a developer for review.

2. **Set up.** Run `apps/<app>/scripts/setup.sh` from the repo root; it is safe
   to re-run and fixes a fresh laptop or cloud environment. If the working tree
   has uncommitted changes, ask them what those are before going on. Then start
   a branch from the latest main:
   `git fetch origin main && git switch -c website/<short-name> origin/main`,
   and delete `apps/<app>/.screenshots/`, which may hold an earlier change's
   screenshots. Done when setup prints `setup: done` and you are on the new
   branch.

3. **Start the preview.** Run the site's dev command from the table above in the
   background. When <http://localhost:3000> answers, give them the link (on
   `vexl-website`, Czech is under `/cs`; in a cloud environment, give the
   forwarded URL). Tell them the **Edit copy** button in the corner lets them
   change texts themselves; what they save there lands in the copy files you
   are editing.

4. **Capture before.** Before you edit anything, capture every section from
   step 1:
   `pnpm --filter <app> screenshots before <name> <path> [selector]`.
   Name each change in kebab-case (`faq-new-question` or `board-new-member`).
   Pass the CSS selector of the changed section so the change is easy to see;
   leave it out when the change affects the whole page. Done when every changed
   section has `before-desktop.png` and `before-mobile.png`. A new page has no
   before.

   If the change grows to a section you haven't captured, commit your work,
   run `git switch --detach origin/main`, wait for the preview to reload,
   capture it, then `git switch -` back.

5. **Change it with them.** Edit the files; the preview reloads on save. After
   each round, tell them what to look at and where. On `vexl-website`, text
   goes into both languages (if they gave only English, write the Czech
   yourself and ask them to check it); `vexl-foundation` is English only. Done
   when they confirm the site looks the way they want.

6. **Verify.** Run the checks in `apps/<app>/AGENTS.md`'s Verification until
   all pass.

7. **Capture after.** Run `screenshots after` with the same names, paths and
   selectors as in step 4, plus one per new page. Open every after image and
   check that the change shows and nothing around it broke before showing them.

8. **Open the PR.** Commit as `feat(<app>): …` or `fix(<app>): …` and push the
   branch. Run `pnpm --filter <app> publish-screenshots`; it prints a
   before/after table per change. Open the PR, ready for review, with:
   - a title and summary of what changed and why, in their words;
   - the screenshot tables;
   - when step 1 found changes beyond the website: a `Needs developer review:`
     line saying what and why.

   Done when you have given them the PR link. A website-only PR is theirs to
   merge. A PR that needs developer review waits for a developer.
