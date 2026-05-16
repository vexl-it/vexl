#!/usr/bin/env tsx

import {existsSync, readFileSync} from "node:fs"
import {join, relative, resolve} from "node:path"

type TranslationMap = Record<string, string>
type MissingTranslation = {
  key: string
  enBaseTranslation: string | null
  baseTranslation: string
  sourceTranslation: string
  sourceFile: "en-base.json" | "base.json"
}

const repoRoot = process.cwd()
const localizationDir = join(repoRoot, "packages", "localization")
const basePath = join(localizationDir, "base.json")
const enBasePath = join(localizationDir, "en-base.json")

function usage(): never {
  console.error(
    [
      "Usage: yarn tsx .agents/skills/sync-localization-translations/scripts/get-missing-translations.ts <locale-code|locale-file> [--limit N] [--offset N]",
      "",
      "Examples:",
      "  yarn tsx .agents/skills/sync-localization-translations/scripts/get-missing-translations.ts cs --limit 25",
      "  yarn tsx .agents/skills/sync-localization-translations/scripts/get-missing-translations.ts packages/localization/de-base.json --offset 25 --limit 25",
      "",
      "Outputs JSON with missing keys plus en-base.json and base.json source values.",
    ].join("\n"),
  )
  process.exit(1)
}

function readTranslations(filePath: string): TranslationMap {
  const raw = readFileSync(filePath, "utf8")
  const parsed: unknown = JSON.parse(raw)

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON object`)
  }

  const output: TranslationMap = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string") {
      throw new Error(`${filePath} has non-string value for key ${key}`)
    }

    output[key] = value
  }

  return output
}

function parseNumberFlag(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag)

  if (index === -1) return fallback

  const raw = process.argv[index + 1]
  if (raw === undefined) usage()

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer`)
  }

  return parsed
}

function localePathFromArg(raw: string): string {
  if (/^[a-z]{2,3}$/.test(raw)) {
    return join(localizationDir, `${raw}-base.json`)
  }

  return resolve(repoRoot, raw)
}

const localeArg = process.argv[2]
if (localeArg === undefined || localeArg.startsWith("--")) usage()

const limit = parseNumberFlag("--limit", 25)
const offset = parseNumberFlag("--offset", 0)
const localePath = localePathFromArg(localeArg)

if (!existsSync(localePath)) {
  throw new Error(`Locale file does not exist: ${localePath}`)
}

const base = readTranslations(basePath)
const enBase = readTranslations(enBasePath)
const locale = readTranslations(localePath)
const missing: MissingTranslation[] = []

for (const [key, baseTranslation] of Object.entries(base)) {
  if (locale[key] !== undefined) continue

  const enBaseTranslation = enBase[key]
  const hasEnglishSource = enBaseTranslation !== undefined && enBaseTranslation.trim() !== ""

  missing.push({
    key,
    enBaseTranslation: enBaseTranslation ?? null,
    baseTranslation,
    sourceTranslation: hasEnglishSource ? enBaseTranslation : baseTranslation,
    sourceFile: hasEnglishSource ? "en-base.json" : "base.json",
  })
}

const items: MissingTranslation[] = []
const end = limit === 0 ? missing.length : Math.min(missing.length, offset + limit)

for (let index = offset; index < end; index += 1) {
  const item = missing[index]
  if (item !== undefined) items.push(item)
}

console.log(
  JSON.stringify(
    {
      localeFile: relative(repoRoot, localePath),
      totalMissing: missing.length,
      offset,
      limit,
      returned: items.length,
      hasMore: end < missing.length,
      items,
    },
    null,
    2,
  ),
)
