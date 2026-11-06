---
name: updating-website
description: Takes a non-developer from a website change request to a pull request with before/after screenshots, editing only apps/vexl-website. Use when someone says they are not a developer and want to update the vexl.it website.
---

# Updating the website with a non-developer

The person knows what the site should say and look like. You handle the code,
git and GitHub. Talk about pages, sections, texts and images, and show them the
running site rather than code or diffs. `apps/vexl-website/AGENTS.md` applies
in full; read it first.

Your edits stay inside `apps/vexl-website/`.

## Steps

1. **Understand the change.** If they haven't said what they want, ask: which
   page, what should change, and the new text. Done when you can name every
   page and section that changes. Two kinds of request go elsewhere:
   - **Blog posts and community events** are edited in the backoffice
     (<https://backoffice.vexl.it>). Tell them so, and stop unless something
     else on the site also changes.
   - **Changes beyond the website**: new data or features from the backend,
     the backoffice or the app, or a third-party script, embed or analytics
     tool (see the CSP rule in AGENTS.md). Tell them a developer has to be
     involved and offer to build the website side anyway. If they continue,
     the PR goes to a developer for review.

2. **Set up.** Run `apps/vexl-website/scripts/setup.sh` from the repo root; it
   is safe to re-run and fixes a fresh laptop or cloud environment. If the
   working tree has uncommitted changes, ask them what those are before going
   on. Then start a branch from the latest main:
   `git fetch origin main && git switch -c website/<short-name> origin/main`,
   and delete `apps/vexl-website/.screenshots/`, which may hold an earlier
   change's screenshots. Done when setup prints `setup: done` and you are on
   the new branch.

3. **Start the preview.** Run `pnpm --filter vexl-website dev:prod-data` in the
   background. When <http://localhost:3000> answers, give them the link (Czech
   is under `/cs`; in a cloud environment, give the forwarded URL). Tell them
   the **Edit copy** button in the corner lets them change texts themselves;
   what they save there lands in the copy files you are editing.

4. **Capture before.** Before you edit anything, capture every section from
   step 1:
   `pnpm --filter vexl-website screenshots before <name> <path> [selector]`.
   Name each change in kebab-case (`faq-new-question`). Pass the CSS selector
   of the changed section so the change is easy to see; leave it out when the
   change affects the whole page. Done when every changed section has
   `before-desktop.png` and `before-mobile.png`. A new page has no before.

   If the change grows to a section you haven't captured, commit your work,
   run `git switch --detach origin/main`, wait for the preview to reload,
   capture it, then `git switch -` back.

5. **Change it with them.** Edit the files; the preview reloads on save. After
   each round, tell them what to look at and where. Text goes into both
   languages. If they gave only English, write the Czech yourself and ask them
   to check it. Done when they confirm the site looks the way they want.

6. **Verify.** Run the checks in AGENTS.md's Verification until all pass.

7. **Capture after.** Run `screenshots after` with the same names, paths and
   selectors as in step 4, plus one per new page. Open every after image and
   check that the change shows and nothing around it broke before showing them.

8. **Open the PR.** Commit as `feat(vexl-website): …` or
   `fix(vexl-website): …` and push the branch. Run
   `pnpm --filter vexl-website publish-screenshots`; it prints a before/after
   table per change. Open the PR, ready for review, with:
   - a title and summary of what changed and why, in their words;
   - the screenshot tables;
   - when step 1 found changes beyond the website: a `Needs developer review:`
     line saying what and why.

   Done when you have given them the PR link. A website-only PR is theirs to
   merge. A PR that needs developer review waits for a developer.
