import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {generateTranslations} from './generateTranslations.mjs'

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const localesRoot = path.join(packageRoot, 'locales')
const sourceLocale = 'en'
const pluralSuffixPattern = /_(zero|one|two|few|many|other)$/
const errors = []
const warnings = []

function jsonFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right))
}

function readTranslations(filePath) {
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    errors.push(
      `${path.relative(packageRoot, filePath)}: invalid JSON (${error.message})`
    )
    return undefined
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    errors.push(
      `${path.relative(packageRoot, filePath)}: root must be an object`
    )
    return undefined
  }

  validateStringLeaves(parsed, path.relative(packageRoot, filePath))

  return parsed
}

function validateStringLeaves(value, location) {
  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}:${key}`
    if (typeof child === 'string') continue
    if (child !== null && !Array.isArray(child) && typeof child === 'object') {
      validateStringLeaves(child, childLocation)
      continue
    }
    errors.push(`${childLocation}: value must be a string`)
  }
}

function stringEntries(value, prefix = '') {
  const entries = []
  for (const [key, child] of Object.entries(value)) {
    const childKey = prefix === '' ? key : `${prefix}.${key}`
    if (typeof child === 'string') {
      entries.push([childKey, child])
    } else if (
      child !== null &&
      !Array.isArray(child) &&
      typeof child === 'object'
    ) {
      entries.push(...stringEntries(child, childKey))
    }
  }
  return entries
}

function hasSourceKey(sourceKeys, key) {
  if (sourceKeys.has(key)) return true

  const baseKey = key.replace(pluralSuffixPattern, '')
  if (baseKey === key) return false
  if (sourceKeys.has(baseKey)) return true

  return [...sourceKeys].some(
    (sourceKey) => sourceKey.replace(pluralSuffixPattern, '') === baseKey
  )
}

const sourceDirectory = path.join(localesRoot, sourceLocale)
const sourceTranslations = new Map()

for (const fileName of jsonFiles(sourceDirectory)) {
  const translations = readTranslations(path.join(sourceDirectory, fileName))
  sourceTranslations.set(fileName, translations)

  if (translations !== undefined) {
    for (const [key, value] of stringEntries(translations)) {
      if (value === '') warnings.push(`${sourceLocale}/${fileName}:${key}`)
    }
  }
}

const locales = fs
  .readdirSync(localesRoot, {withFileTypes: true})
  .filter((entry) => entry.isDirectory() && entry.name !== sourceLocale)
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right))

for (const locale of locales) {
  const localeDirectory = path.join(localesRoot, locale)
  for (const fileName of jsonFiles(localeDirectory)) {
    const filePath = path.join(localeDirectory, fileName)
    const translations = readTranslations(filePath)
    const source = sourceTranslations.get(fileName)

    if (!sourceTranslations.has(fileName)) {
      errors.push(`${locale}/${fileName}: corresponding en file is missing`)
      continue
    }
    if (translations === undefined || source === undefined) continue

    const sourceKeys = new Set(stringEntries(source).map(([key]) => key))
    for (const [key] of stringEntries(translations)) {
      if (!hasSourceKey(sourceKeys, key)) {
        errors.push(`${locale}/${fileName}:${key}: orphan translation key`)
      }
    }
  }
}

const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'vexl-localization-')
)
try {
  generateTranslations(temporaryRoot)
  for (const fileName of ['translations.ts', 'extraTranslations.ts']) {
    const committedPath = path.join(packageRoot, 'src', fileName)
    const generatedPath = path.join(temporaryRoot, fileName)
    if (
      !fs.existsSync(committedPath) ||
      fs.readFileSync(committedPath, 'utf8') !==
        fs.readFileSync(generatedPath, 'utf8')
    ) {
      errors.push(`src/${fileName}: stale; run pnpm generate`)
    }
  }
} catch (error) {
  errors.push(`codegen freshness check failed: ${error.message}`)
} finally {
  fs.rmSync(temporaryRoot, {recursive: true, force: true})
}

if (warnings.length > 0) {
  console.warn('Translation warnings:')
  for (const warning of warnings)
    console.warn(`  - empty source value: ${warning}`)
}

if (errors.length > 0) {
  console.error(`Translation check failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exitCode = 1
} else {
  console.log(`Translation check passed for ${locales.length + 1} locales.`)
}
