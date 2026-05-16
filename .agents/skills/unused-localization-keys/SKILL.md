---
name: unused-localization-keys
description: Find translation keys from packages/localization/base.json that are unused by app source code, report them, and optionally remove them from base.json plus sibling locale files. Use when cleaning Vexl mobile/app localization strings or pruning stale base translation keys.
---

# Unused Localization Keys

Find stale keys in `packages/localization/base.json` by scanning app source for translation key references. Use the bundled script for both reporting and removal.

## Quick Start

From the repository root:

```bash
yarn tsx .agents/skills/unused-localization-keys/scripts/find-unused-localization-keys.ts
```

To remove the unused keys from `base.json` and sibling `*-base.json` locale files:

```bash
yarn tsx .agents/skills/unused-localization-keys/scripts/find-unused-localization-keys.ts --fix
```

## Usage

1. Run the script without `--fix` first and review the unused key list.
2. Check the `Dynamic prefixes kept` section. Template calls such as ``t(`feedback.objection.${objection}`)`` keep every `base.json` key with that prefix.
3. If the result is reasonable, rerun with `--fix`.
4. Run project verification after removal:

```bash
yarn turbo:typecheck
yarn turbo:format
yarn turbo:lint
```

The default scan path is `apps/mobile/src`, because this repo's `base.json` powers the mobile app translations. Add more scan paths when checking other app surfaces:

```bash
yarn tsx .agents/skills/unused-localization-keys/scripts/find-unused-localization-keys.ts --scan apps/mobile/src --scan apps/ui-book
```

Use `--json` when another script or agent needs structured output:

```bash
yarn tsx .agents/skills/unused-localization-keys/scripts/find-unused-localization-keys.ts --json
```

## Detection Rules

The script marks a key as used when it finds:

- A direct translation call, such as `t('common.next')` or `i18n.t('common.next')`.
- The exact key as a quoted string anywhere in scanned source.
- A key under a dynamic template prefix, such as every `feedback.objection.*` key for ``t(`feedback.objection.${objection}`)``.

`--fix` changes `packages/localization/base.json` and removes the same keys from sibling locale files such as `cs-base.json`, `de-base.json`, and `en-base.json`. Do not edit unrelated Crowdin-managed translation content manually.
