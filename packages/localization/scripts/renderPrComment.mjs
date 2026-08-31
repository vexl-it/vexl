import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {APP_LOCALES} from './generateTranslations.mjs'
import {readFlattenedJson} from './localeUtils.mjs'

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const defaultLocalesRoot = path.join(packageRoot, 'locales')

export const COMMENT_MARKER = '<!-- vexl-translation-check -->'

const REVIEW_FIRST_LOCALES = ['cs', 'sk', 'de']
const MAX_VISIBLE_ERRORS_PER_GROUP = 10
const MAX_CELL_LENGTH = 300
// GitHub caps issue comments at 65536 characters; stay well under it.
const RENDER_BUDGET = 60000
const COMPACT_ERRORS_PER_GROUP = 5
// Headroom kept while pushing repeated blocks so the short trailing lines
// (truncation notice, removed-keys summary) always fit afterwards.
const TRAILING_LINES_RESERVE = 250

function budgetWriter(limit) {
  const parts = []
  let length = 0
  return {
    tryPush(text) {
      if (length + text.length > limit) return false
      parts.push(text)
      length += text.length
      return true
    },
    remaining() {
      return limit - length
    },
    toString() {
      return parts.join('')
    },
  }
}

// Shipped locales in review order: cs, sk, de first, then the rest A-Z.
function reviewLocales() {
  const rest = APP_LOCALES.map(([locale]) => locale)
    .filter(
      (locale) => locale !== 'en' && !REVIEW_FIRST_LOCALES.includes(locale)
    )
    .sort((left, right) => left.localeCompare(right))
  return [...REVIEW_FIRST_LOCALES, ...rest]
}

function tableCell(value) {
  if (value === undefined) return '*missing*'
  const truncated =
    value.length > MAX_CELL_LENGTH
      ? `${value.slice(0, MAX_CELL_LENGTH)}…`
      : value
  return truncated.replaceAll('|', '\\|').replaceAll(/\r?\n/g, '<br>')
}

function renderErrorGroup(groupTitle, groupErrors) {
  const lines = groupErrors.map((error) => `- ${error.message}`)
  if (groupErrors.length <= MAX_VISIBLE_ERRORS_PER_GROUP) {
    return [`**${groupTitle}** (${groupErrors.length})`, '', ...lines]
  }
  return [
    '<details>',
    `<summary><strong>${groupTitle}</strong> (${groupErrors.length})</summary>`,
    '',
    ...lines,
    '',
    '</details>',
  ]
}

const ERRORS_HEADING = '### ❌ Translation check failed\n\n'
const FIX_HINT =
  '**How to fix:** for keys added or changed in this PR, follow the ' +
  '`adding-translation-key` skill (`.agents/skills/adding-translation-key`). ' +
  'For a full repair across all shipped locales, invoke the ' +
  '`translation-audit` skill.\n\n'
const FULL_LIST_HINT =
  'Error list truncated — run `pnpm check:translations` locally for the ' +
  'full list.\n\n'

// Map of "type · locale" title -> errors, in first-appearance order.
function groupErrors(errors) {
  const groups = new Map()
  for (const error of errors) {
    const title =
      error.locale === null || error.locale === undefined
        ? error.type
        : `${error.type} · ${error.locale}`
    if (!groups.has(title)) groups.set(title, [])
    groups.get(title).push(error)
  }
  return groups
}

function pushErrorsSection(out, report) {
  const groups = groupErrors(report.errors)

  const fullLines = ['### ❌ Translation check failed', '']
  for (const [title, errors] of groups) {
    fullLines.push(...renderErrorGroup(title, errors), '')
  }
  if (out.tryPush(`${fullLines.join('\n')}\n${FIX_HINT}`)) return

  // Too big even collapsed: per-group counts with the first few errors each.
  out.tryPush(ERRORS_HEADING)
  const reserve = FULL_LIST_HINT.length + FIX_HINT.length
  for (const [title, errors] of groups) {
    const sample = errors
      .slice(0, COMPACT_ERRORS_PER_GROUP)
      .map((error) => `- ${error.message}`)
    const block = `**${title}** (${errors.length} errors)\n\n${sample.join('\n')}\n\n`
    if (out.remaining() - reserve < block.length) break
    out.tryPush(block)
  }
  out.tryPush(FULL_LIST_HINT)
  out.tryPush(FIX_HINT)
}

function localeValueLookup(localesRoot) {
  const cache = new Map()
  return (locale, fileName, key) => {
    const cacheKey = `${locale}/${fileName}`
    if (!cache.has(cacheKey)) {
      let entries
      try {
        entries = readFlattenedJson(localesRoot, locale, fileName)
      } catch {
        entries = undefined
      }
      cache.set(cacheKey, entries)
    }
    return cache.get(cacheKey)?.get(key)
  }
}

function renderKeyDetails({entry, changed, locales, lookupValue}) {
  const summaryParts = [
    changed ? '✏️' : '🆕',
    `<code>${entry.file}</code> · <code>${entry.key}</code>`,
  ]
  if (changed) {
    summaryParts.push('— ⚠️ en changed — existing translations may be stale')
  }

  const rows = [
    ['Locale', 'Value'],
    ['---', '---'],
  ]
  if (changed) rows.push(['en (before)', tableCell(entry.before)])
  rows.push(['en', tableCell(changed ? entry.after : entry.value)])
  for (const locale of locales) {
    rows.push([locale, tableCell(lookupValue(locale, entry.file, entry.key))])
  }

  return [
    '<details>',
    `<summary>${summaryParts.join(' ')}</summary>`,
    '',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    '',
    '</details>',
  ]
}

function pushStringsSection(out, diff, localesRoot) {
  const locales = reviewLocales()
  const lookupValue = localeValueLookup(localesRoot)
  const entries = [
    ...diff.added.map((entry) => ({entry, changed: false})),
    ...diff.changed.map((entry) => ({entry, changed: true})),
  ]

  if (!out.tryPush('### 🌍 New & changed strings\n\n')) return

  let shown = 0
  for (const {entry, changed} of entries) {
    const block = `${renderKeyDetails({entry, changed, locales, lookupValue}).join('\n')}\n\n`
    if (out.remaining() - TRAILING_LINES_RESERVE < block.length) break
    out.tryPush(block)
    shown++
  }
  if (shown < entries.length) {
    out.tryPush(
      `…and ${entries.length - shown} more keys not shown — see the en diff in this PR.\n\n`
    )
  }

  if (diff.removed.length > 0) {
    const fullLine =
      '**Removed keys:** ' +
      diff.removed
        .map((entry) => `\`${entry.file}\` · \`${entry.key}\``)
        .join(', ') +
      '\n'
    if (!out.tryPush(fullLine)) {
      out.tryPush(
        `**Removed keys:** ${diff.removed.length} — see the en diff in this PR.\n`
      )
    }
  }
}

export function renderPrComment({
  report,
  diff,
  localesRoot = defaultLocalesRoot,
}) {
  const hasStringChanges = diff.added.length > 0 || diff.changed.length > 0
  if (report.ok && !hasStringChanges) return ''

  const out = budgetWriter(RENDER_BUDGET)
  out.tryPush(`${COMMENT_MARKER}\n\n`)
  if (!report.ok) pushErrorsSection(out, report)
  if (hasStringChanges || diff.removed.length > 0) {
    pushStringsSection(out, diff, localesRoot)
  }

  return `${out.toString().trimEnd()}\n`
}

function readCliArg(args, name) {
  const index = args.indexOf(name)
  if (index === -1 || args[index + 1] === undefined) {
    console.error(
      'Usage: node scripts/renderPrComment.mjs --report <check-report.json> --diff <diff.json>'
    )
    process.exit(1)
  }
  return args[index + 1]
}

function runCli() {
  const args = process.argv.slice(2)
  const report = JSON.parse(fs.readFileSync(readCliArg(args, '--report')))
  const diff = JSON.parse(fs.readFileSync(readCliArg(args, '--diff')))

  const markdown = renderPrComment({report, diff})
  if (markdown !== '') process.stdout.write(markdown)
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli()
}
