import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {
  APP_LOCALES,
  DOC_FILES,
  generateTranslations,
} from './generateTranslations.mjs'
import {
  flattenStringEntries,
  jsonFiles,
  placeholderNames,
} from './localeUtils.mjs'

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const defaultLocalesRoot = path.join(packageRoot, 'locales')
const sourceLocale = 'en'
const pluralSuffixPattern = /_(zero|one|two|few|many|other)$/
const docFileNames = new Set(DOC_FILES.map((name) => `${name}.json`))

export const defaultShippedLocales = APP_LOCALES.map(([locale]) => locale)
  .filter((locale) => locale !== sourceLocale)
  .sort((left, right) => left.localeCompare(right))

function formatPlaceholderSet(names) {
  if (names.size === 0) return '(none)'
  return [...names]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => `{{${name}}}`)
    .join(', ')
}

function pluralBaseKey(key) {
  return key.replace(pluralSuffixPattern, '')
}

function hasSourceKey(sourceKeys, sourcePluralBases, key) {
  if (sourceKeys.has(key)) return true

  const baseKey = pluralBaseKey(key)
  if (baseKey === key) return false
  return sourceKeys.has(baseKey) || sourcePluralBases.has(baseKey)
}

function deleteFlattenedKey(value, key) {
  if (typeof value[key] === 'string') {
    delete value[key]
    return true
  }
  for (const [childKey, child] of Object.entries(value)) {
    if (child === null || Array.isArray(child) || typeof child !== 'object')
      continue
    if (!key.startsWith(`${childKey}.`)) continue
    if (deleteFlattenedKey(child, key.slice(childKey.length + 1))) {
      if (Object.keys(child).length === 0) delete value[childKey]
      return true
    }
  }
  return false
}

class LocaleTreeReader {
  constructor(localesRoot, errors) {
    this.localesRoot = localesRoot
    this.errors = errors
    this.cache = new Map()
  }

  filePath(locale, fileName) {
    return path.join(this.localesRoot, locale, fileName)
  }

  // Returns {parsed, entries: Map(dottedKey -> string)}, undefined when the
  // file is missing or invalid. Records invalidJson / nonStringValue errors.
  read(locale, fileName) {
    const cacheKey = `${locale}/${fileName}`
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)

    const result = this.readUncached(locale, fileName)
    this.cache.set(cacheKey, result)
    return result
  }

  readUncached(locale, fileName) {
    const filePath = this.filePath(locale, fileName)
    if (!fs.existsSync(filePath)) return undefined

    let parsed
    try {
      parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      this.errors.push({
        type: 'invalidJson',
        locale,
        file: fileName,
        key: null,
        message: `${locale}/${fileName}: invalid JSON (${error.message})`,
      })
      return undefined
    }

    if (
      parsed === null ||
      Array.isArray(parsed) ||
      typeof parsed !== 'object'
    ) {
      this.errors.push({
        type: 'invalidJson',
        locale,
        file: fileName,
        key: null,
        message: `${locale}/${fileName}: root must be an object`,
      })
      return undefined
    }

    this.reportNonStringLeaves(parsed, locale, fileName, '')
    return {parsed, entries: flattenStringEntries(parsed)}
  }

  reportNonStringLeaves(value, locale, fileName, prefix) {
    for (const [key, child] of Object.entries(value)) {
      const childKey = prefix === '' ? key : `${prefix}.${key}`
      if (typeof child === 'string') continue
      if (
        child !== null &&
        !Array.isArray(child) &&
        typeof child === 'object'
      ) {
        this.reportNonStringLeaves(child, locale, fileName, childKey)
        continue
      }
      this.errors.push({
        type: 'nonStringValue',
        locale,
        file: fileName,
        key: childKey,
        message: `${locale}/${fileName}:${childKey}: value must be a string`,
      })
    }
  }
}

function listLocaleDirectories(localesRoot) {
  return fs
    .readdirSync(localesRoot, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && entry.name !== sourceLocale)
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

function fixStaleFiles({localesRoot, enFiles}) {
  const removedFiles = []
  const removedKeys = []
  // Errors found here (e.g. invalid JSON) are reported by the check pass that
  // follows; swallow them to avoid duplicates.
  const reader = new LocaleTreeReader(localesRoot, [])

  for (const locale of listLocaleDirectories(localesRoot)) {
    for (const fileName of jsonFiles(path.join(localesRoot, locale))) {
      const filePath = path.join(localesRoot, locale, fileName)

      if (!enFiles.has(fileName)) {
        fs.rmSync(filePath)
        removedFiles.push({locale, file: fileName})
        continue
      }

      const source = enFiles.get(fileName)
      if (source === undefined) continue

      const data = reader.readUncached(locale, fileName)
      if (data === undefined) continue

      let changed = false
      for (const [key] of data.entries) {
        if (!hasSourceKey(source.keys, source.pluralBases, key)) {
          if (deleteFlattenedKey(data.parsed, key)) {
            removedKeys.push({locale, file: fileName, key})
            changed = true
          }
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, `${JSON.stringify(data.parsed, null, 2)}\n`)
      }
    }
  }

  return {removedFiles, removedKeys}
}

function indexEnFiles({localesRoot, reader, warnings}) {
  // fileName -> {entries: Map(key -> value), keys, pluralBases} | undefined
  const enFiles = new Map()
  const enDirectory = path.join(localesRoot, sourceLocale)

  for (const fileName of jsonFiles(enDirectory)) {
    const data = reader.read(sourceLocale, fileName)
    if (data === undefined) {
      enFiles.set(fileName, undefined)
      continue
    }

    const entries = data.entries
    const keys = new Set(entries.keys())
    const pluralBases = new Set(
      [...keys]
        .filter((key) => pluralSuffixPattern.test(key))
        .map(pluralBaseKey)
    )
    enFiles.set(fileName, {entries, keys, pluralBases})

    for (const [key, value] of entries) {
      if (value === '') {
        warnings.push({
          type: 'emptyValue',
          locale: sourceLocale,
          file: fileName,
          key,
          message: `${sourceLocale}/${fileName}:${key}: empty source value`,
        })
      }
    }
  }

  return enFiles
}

function checkBasics({localesRoot, reader, enFiles, errors}) {
  for (const locale of listLocaleDirectories(localesRoot)) {
    for (const fileName of jsonFiles(path.join(localesRoot, locale))) {
      const data = reader.read(locale, fileName)

      if (!enFiles.has(fileName)) {
        errors.push({
          type: 'missingEnFile',
          locale,
          file: fileName,
          key: null,
          message: `${locale}/${fileName}: corresponding en file is missing`,
        })
        continue
      }

      const source = enFiles.get(fileName)
      if (data === undefined || source === undefined) continue

      for (const [key] of data.entries) {
        if (!hasSourceKey(source.keys, source.pluralBases, key)) {
          errors.push({
            type: 'orphanKey',
            locale,
            file: fileName,
            key,
            message: `${locale}/${fileName}:${key}: orphan translation key`,
          })
        }
      }
    }
  }
}

function checkShippedLocaleFile({locale, fileName, source, data, errors}) {
  const localeKeys = data === undefined ? new Map() : data.entries
  const fileMissing = data === undefined
  const missingSuffix = fileMissing ? ' (locale file is missing)' : ''

  const pluralFamilies = new Map()
  for (const [key, value] of source.entries) {
    if (!pluralSuffixPattern.test(key)) continue
    const base = pluralBaseKey(key)
    if (!pluralFamilies.has(base)) {
      pluralFamilies.set(base, {placeholders: new Set()})
    }
    for (const name of placeholderNames(value)) {
      pluralFamilies.get(base).placeholders.add(name)
    }
  }

  for (const [key, enValue] of source.entries) {
    if (pluralSuffixPattern.test(key)) continue

    const localeValue = localeKeys.get(key)
    if (localeValue === undefined) {
      errors.push({
        type: 'missingKey',
        locale,
        file: fileName,
        key,
        message: `${locale}/${fileName}:${key}: missing translation key${missingSuffix}`,
      })
      continue
    }

    const expected = placeholderNames(enValue)
    const found = placeholderNames(localeValue)
    const matches =
      expected.size === found.size &&
      [...expected].every((name) => found.has(name))
    if (!matches) {
      errors.push({
        type: 'placeholderMismatch',
        locale,
        file: fileName,
        key,
        message: `${locale}/${fileName}:${key}: placeholders must be ${formatPlaceholderSet(expected)}, found ${formatPlaceholderSet(found)}`,
      })
    }
  }

  const requiredCategories = new Intl.PluralRules(locale).resolvedOptions()
    .pluralCategories

  for (const [base, family] of pluralFamilies) {
    for (const category of requiredCategories) {
      const key = `${base}_${category}`
      if (!localeKeys.has(key)) {
        errors.push({
          type: 'missingPluralForm',
          locale,
          file: fileName,
          key,
          message: `${locale}/${fileName}:${key}: missing "${category}" plural form required for ${locale}${missingSuffix}`,
        })
      }
    }

    for (const [key, value] of localeKeys) {
      if (!pluralSuffixPattern.test(key) || pluralBaseKey(key) !== base)
        continue
      const invented = [...placeholderNames(value)].filter(
        (name) => !family.placeholders.has(name)
      )
      if (invented.length > 0) {
        errors.push({
          type: 'placeholderMismatch',
          locale,
          file: fileName,
          key,
          message: `${locale}/${fileName}:${key}: placeholders must be a subset of ${formatPlaceholderSet(family.placeholders)}, found extra ${formatPlaceholderSet(new Set(invented))}`,
        })
      }
    }
  }
}

function legalDocStatus({source, data}) {
  if (data === undefined) return 'missingFile'
  for (const key of source.keys) {
    if (!data.entries.has(key)) return 'missingKeys'
  }
  return 'ok'
}

function checkShippedLocales({shippedLocales, reader, enFiles, errors}) {
  const legalDocs = []

  for (const locale of shippedLocales) {
    for (const [fileName, source] of enFiles) {
      if (source === undefined) continue
      const data = reader.read(locale, fileName)

      if (docFileNames.has(fileName)) {
        legalDocs.push({
          locale,
          file: fileName,
          status: legalDocStatus({source, data}),
        })
        continue
      }

      checkShippedLocaleFile({locale, fileName, source, data, errors})
    }
  }

  return legalDocs
}

function checkCodegenFreshness(errors) {
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
        errors.push({
          type: 'staleCodegen',
          locale: null,
          file: `src/${fileName}`,
          key: null,
          message: `src/${fileName}: stale; run pnpm generate`,
        })
      }
    }
  } catch (error) {
    errors.push({
      type: 'staleCodegen',
      locale: null,
      file: null,
      key: null,
      message: `codegen freshness check failed: ${error.message}`,
    })
  } finally {
    fs.rmSync(temporaryRoot, {recursive: true, force: true})
  }
}

export function checkTranslations({
  localesRoot = defaultLocalesRoot,
  skipCodegenCheck = false,
  fixStale = false,
  shippedLocales = defaultShippedLocales,
} = {}) {
  const errors = []
  const warnings = []
  const reader = new LocaleTreeReader(localesRoot, errors)
  const enFiles = indexEnFiles({localesRoot, reader, warnings})

  let fixes
  if (fixStale) fixes = fixStaleFiles({localesRoot, enFiles})

  checkBasics({localesRoot, reader, enFiles, errors})
  const legalDocs = checkShippedLocales({
    shippedLocales,
    reader,
    enFiles,
    errors,
  })
  if (!skipCodegenCheck) checkCodegenFreshness(errors)

  const enKeyCount = [...enFiles.values()].reduce(
    (count, source) => count + (source === undefined ? 0 : source.keys.size),
    0
  )
  const checkedLocales = [sourceLocale, ...listLocaleDirectories(localesRoot)]

  const report = {
    ok: errors.length === 0,
    errors,
    warnings,
    legalDocs,
    stats: {enKeyCount, checkedLocales},
  }
  if (fixes !== undefined) report.fixes = fixes
  return report
}

function printHumanReport(report) {
  if (report.fixes !== undefined) {
    const {removedFiles, removedKeys} = report.fixes
    for (const {locale, file} of removedFiles) {
      console.error(`Removed ${locale}/${file} (no en counterpart)`)
    }
    for (const {locale, file, key} of removedKeys) {
      console.error(`Removed orphan key ${locale}/${file}:${key}`)
    }
  }

  if (report.warnings.length > 0) {
    console.warn('Translation warnings:')
    for (const warning of report.warnings) {
      console.warn(`  - ${warning.message}`)
    }
  }

  const pendingDocs = report.legalDocs.filter(({status}) => status !== 'ok')
  if (pendingDocs.length > 0) {
    console.warn('Legal document parity (informational, not failing):')
    for (const {locale, file, status} of pendingDocs) {
      console.warn(`  - ${locale}/${file}: ${status}`)
    }
  }

  if (report.errors.length > 0) {
    console.error(
      `Translation check failed with ${report.errors.length} error(s):`
    )
    for (const error of report.errors) console.error(`  - ${error.message}`)
  } else {
    console.log(
      `Translation check passed for ${report.stats.checkedLocales.length} locales.`
    )
  }
}

function runCli() {
  const args = new Set(process.argv.slice(2))
  const report = checkTranslations({
    fixStale: args.has('--fix-stale'),
  })

  if (args.has('--json')) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHumanReport(report)
  }

  if (!report.ok) process.exitCode = 1
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli()
}
