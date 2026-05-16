#!/usr/bin/env tsx

import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {join, relative, resolve} from "node:path"

type TranslationMap = Record<string, string>
type TranslationItem = {
  key: string
  value: string
}

const repoRoot = process.cwd()
const localizationDir = join(repoRoot, "packages", "localization")
const basePath = join(localizationDir, "base.json")

function usage(): never {
  console.error(
    [
      "Usage: yarn tsx .agents/skills/sync-localization-translations/scripts/upsert-translations.ts <locale-code|locale-file> --input <translations.json>",
      "",
      "Input may be either:",
      '  { "some.key": "Translated value" }',
      '  [{ "key": "some.key", "value": "Translated value" }]',
      '  { "translations": { "some.key": "Translated value" } }',
      '  { "translations": [{ "key": "some.key", "value": "Translated value" }] }',
      "",
      "Use --input - to read the JSON payload from stdin.",
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

function localePathFromArg(raw: string): string {
  if (/^[a-z]{2,3}$/.test(raw)) {
    return join(localizationDir, `${raw}-base.json`)
  }

  return resolve(repoRoot, raw)
}

function readInput(): unknown {
  const inputIndex = process.argv.indexOf("--input")
  if (inputIndex === -1) usage()

  const inputPath = process.argv[inputIndex + 1]
  if (inputPath === undefined) usage()

  const raw = inputPath === "-" ? readFileSync(0, "utf8") : readFileSync(resolve(repoRoot, inputPath), "utf8")

  return JSON.parse(raw)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseTranslationItems(input: unknown): TranslationItem[] {
  if (Array.isArray(input)) {
    const items: TranslationItem[] = []

    for (const item of input) {
      if (!isRecord(item) || typeof item.key !== "string" || typeof item.value !== "string") {
        throw new Error("Array input must contain objects with string key and value fields")
      }

      items.push({key: item.key, value: item.value})
    }

    return items
  }

  if (!isRecord(input)) {
    throw new Error("Input must be an object, array, or object with translations")
  }

  if (input.translations !== undefined) {
    return parseTranslationItems(input.translations)
  }

  const items: TranslationItem[] = []

  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") {
      throw new Error(`Translation value for ${key} must be a string`)
    }

    items.push({key, value})
  }

  return items
}

const localeArg = process.argv[2]
if (localeArg === undefined || localeArg.startsWith("--")) usage()

const localePath = localePathFromArg(localeArg)
if (!existsSync(localePath)) {
  throw new Error(`Locale file does not exist: ${localePath}`)
}

const base = readTranslations(basePath)
const locale = readTranslations(localePath)
const items = parseTranslationItems(readInput())
const seen = new Set<string>()

for (const item of items) {
  if (base[item.key] === undefined) {
    throw new Error(`Key is not present in base.json: ${item.key}`)
  }

  if (seen.has(item.key)) {
    throw new Error(`Duplicate translation key in input: ${item.key}`)
  }

  seen.add(item.key)
  locale[item.key] = item.value
}

const ordered: TranslationMap = {}

for (const key of Object.keys(base)) {
  const value = locale[key]
  if (value !== undefined) ordered[key] = value
}

for (const [key, value] of Object.entries(locale)) {
  if (base[key] === undefined) ordered[key] = value
}

writeFileSync(localePath, `${JSON.stringify(ordered, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      localeFile: relative(repoRoot, localePath),
      upserted: items.length,
      keyCount: Object.keys(ordered).length,
      missingAfterUpsert: Object.keys(base).length - Object.keys(ordered).filter((key) => base[key] !== undefined).length,
    },
    null,
    2,
  ),
)
