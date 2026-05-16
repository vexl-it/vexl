#!/usr/bin/env tsx

import {readFileSync, readdirSync} from "node:fs"
import {join, relative} from "node:path"

type TranslationMap = Record<string, string>

const repoRoot = process.cwd()
const localizationDir = join(repoRoot, "packages", "localization")
const basePath = join(localizationDir, "base.json")
const enBasePath = join(localizationDir, "en-base.json")
const includePrompts = process.argv.includes("--prompts")
const jsonOutput = process.argv.includes("--json")

const languageNames = new Map<string, string>([
  ["ar", "Arabic"],
  ["bg", "Bulgarian"],
  ["cs", "Czech"],
  ["de", "German"],
  ["en", "English"],
  ["es", "Spanish"],
  ["fa", "Persian"],
  ["fi", "Finnish"],
  ["fr", "French"],
  ["id", "Indonesian"],
  ["it", "Italian"],
  ["ja", "Japanese"],
  ["nl", "Dutch"],
  ["no", "Norwegian"],
  ["pcm", "Nigerian Pidgin"],
  ["pl", "Polish"],
  ["pt", "Portuguese"],
  ["sk", "Slovak"],
  ["sv", "Swedish"],
  ["sw", "Swahili"],
  ["tr", "Turkish"],
  ["uk", "Ukrainian"],
  ["zh", "Chinese"],
])

function readTranslations(filePath: string): TranslationMap {
  const raw = readFileSync(filePath, "utf8")
  const parsed: unknown = JSON.parse(raw)

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON object`)
  }

  const entries = Object.entries(parsed)
  const invalid = entries.find(([, value]) => typeof value !== "string")

  if (invalid !== undefined) {
    throw new Error(`${filePath} has non-string value for key ${invalid[0]}`)
  }

  return Object.fromEntries(entries)
}

function repoRelative(filePath: string): string {
  return relative(repoRoot, filePath)
}

function promptForLocale(localeFile: string, localeCode: string, languageName: string): string {
  return [
    `Synchronize ${repoRelative(localeFile)} for ${languageName} (${localeCode}).`,
    "",
    "You are not alone in the codebase. Other agents may be editing other locale files in parallel. Edit only your assigned file and do not revert or modify changes outside it.",
    "",
    "Use the skill scripts instead of opening large JSON files. Fetch missing keys with get-missing-translations.ts and write completed translations with upsert-translations.ts.",
    "",
    "Use packages/localization/base.json for the master key list and key order. For source text, the en-base.json value is final when it exists and is non-empty; otherwise translate from the base.json value.",
    "",
    `Translate missing, copied, or placeholder values naturally into ${languageName} in an informal, friendly voice, like talking to a friend. Use familiar second-person forms where ${languageName} distinguishes formality; for Czech, this means tykani, not vykani. Keep existing good ${languageName} translations when they are already correct and match this tone.`,
    "",
    "Preserve placeholders and formatting exactly: tokens like {name}, {{count}}, %s, %d, $1, URLs, markdown markers, app/product names, and newline escape sequences must remain intact. Keep the file valid pretty-printed JSON.",
  ].join("\n")
}

const base = readTranslations(basePath)
const enBase = readTranslations(enBasePath)
const baseKeys = Object.keys(base)

const localeFiles = readdirSync(localizationDir)
  .filter((fileName) => /^[a-z]{2,3}-base\.json$/.test(fileName))
  .sort()

const workItems = localeFiles.map((fileName) => {
  const localeCode = fileName.replace(/-base\.json$/, "")
  const filePath = join(localizationDir, fileName)
  const translations = readTranslations(filePath)
  const missingKeys = baseKeys.filter((key) => translations[key] === undefined)
  const extraKeys = Object.keys(translations).filter((key) => base[key] === undefined)
  const sourceFallbacks = baseKeys.filter((key) => enBase[key] === undefined || enBase[key].trim() === "").length
  const languageName = languageNames.get(localeCode) ?? localeCode

  return {
    file: repoRelative(filePath),
    localeCode,
    languageName,
    keyCount: Object.keys(translations).length,
    requiredKeyCount: baseKeys.length,
    missingKeyCount: missingKeys.length,
    extraKeyCount: extraKeys.length,
    sourceFallbackCount: sourceFallbacks,
    missingKeys,
    extraKeys,
    prompt: promptForLocale(filePath, localeCode, languageName),
  }
})

if (jsonOutput) {
  console.log(JSON.stringify(workItems, null, 2))
} else {
  for (const item of workItems) {
    console.log(
      `${item.file}: ${item.keyCount}/${item.requiredKeyCount} keys, ${item.missingKeyCount} missing, ${item.extraKeyCount} extra`,
    )

    if (item.missingKeyCount > 0) {
      console.log(`  Missing sample: ${item.missingKeys.slice(0, 8).join(", ")}`)
    }

    if (item.extraKeyCount > 0) {
      console.log(`  Extra sample: ${item.extraKeys.slice(0, 8).join(", ")}`)
    }

    if (includePrompts) {
      console.log("")
      console.log("--- worker prompt ---")
      console.log(item.prompt)
      console.log("--- end worker prompt ---")
      console.log("")
    }
  }
}
