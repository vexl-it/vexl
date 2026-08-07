#!/usr/bin/env npx tsx

/**
 * Script to find and cleanup unused translation keys in the codebase.
 *
 * Usage:
 *   pnpm --filter @vexl-next/handy-scripts cleanup-unused-translations
 *
 * What it does:
 *   1. Reads all keys from packages/localization/locales/en/*.json
 *   2. Searches for usages in apps/mobile/src/**
 *   3. Reports keys that are not found in the codebase
 *   4. Asks for confirmation and removes unused keys from their group files
 *
 * Note: Some keys are used dynamically (e.g., `t(`currency.${code}`)`)
 *       The script detects common dynamic patterns and excludes those prefixes.
 */

import {Schema} from 'effect'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {fileURLToPath} from 'url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)

const REPO_ROOT = path.resolve(currentDirPath, '../../..')
const EN_LOCALE_PATH = path.join(REPO_ROOT, 'packages/localization/locales/en')
const MOBILE_SRC_PATH = path.join(REPO_ROOT, 'apps/mobile/src')
const EXCLUDED_LOCALE_FILES = new Set([
  'termsOfUse.json',
  'privacyPolicy.json',
  'childSafetyAndSexAbusePrevention.json',
  'infoPlist.json',
])
const TranslationCatalog = Schema.Record({
  key: Schema.String,
  value: Schema.String,
})

// Keys that are used dynamically and should be excluded from unused detection
// These are prefixes - any key starting with these will be considered "potentially used"
const DYNAMIC_KEY_PREFIXES = [
  'currency.', // t(`currency.${currency.code}`)
  'feedback.objection.', // t(`feedback.objection.${objection}`)
  'progressBar.', // t(`progressBar.${progress.type}`)
  'messages.messagePreviews.', // t(`messages.messagePreviews.${direction}.${type}`)
  'messages.textMessageTypes.', // t(`messages.textMessageTypes.${messageType}`)
  'messages.isBuying', // t(`messages.${buyingOrSelling}`)
  'messages.isSelling', // t(`messages.${buyingOrSelling}`)
  'notifications.', // t(`notifications.${type}.title`)
  'offerForm.spokenLanguages.', // t(`offerForm.spokenLanguages.${spokenLanguage}`)
  'offerForm.SELL', // t(`offerForm.${offer.publicPart.listingType}`)
  'offerForm.BUY', // t(`offerForm.${offer.publicPart.listingType}`)
  'offerForm.error', // t(`offerForm.${reason}`)
  'filterOffers.BTC_TO_CASH', // t(`filterOffers.${option}`)
  'filterOffers.CASH_TO_BTC',
  'filterOffers.BTC_TO_PRODUCT',
  'filterOffers.PRODUCT_TO_BTC',
  'filterOffers.STH_ELSE',
  'filterOffers.ALL_SELLING_BTC',
  'filterOffers.ALL_BUYING_BTC',
  'settings.items.language.', // t(`settings.items.language.${language}`)
  'common.FIAT', // t(`common.${marketplaceFiatOrSatsCurrency}`)
  'common.SATS', // t(`common.${marketplaceFiatOrSatsCurrency}`)
  'common.Network', // t(`common.${e._tag}`) - error tags
  'common.Unauthorized',
  'common.UnexpectedApi',
  'common.HttpApi',
  'common.Parse',
  'common.NotFound',
  'common.Http',
  'common.UnknownClient',
  'common.UnexpectedServer',
  'common.DataAndType',
  'common.InvalidDeepLink',
  'common.ImagePicker',
  'donations.invoiceStatus.', // t(`donations.invoiceStatus.${status}`)
  'tradeChecklist.options.', // t(`tradeChecklist.options.${item}`)
  'loginFlow.verificationCode.errors.', // t(`loginFlow.verificationCode.errors.${e._tag}`)
  'offer.requestStatus.', // t(`offer.requestStatus.${status}`)
  'marketplace.section.',
  'marketplaceFilter.',
  'filterOffers.productCategory.',
  'notes.board.section.',
  'notifications.preferences.',
  'appSettings.appearance.',
  'tabBar.',
]

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const items = fs.readdirSync(dir, {withFileTypes: true})

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git') {
        files.push(...getAllFiles(fullPath, extensions))
      }
    } else if (extensions.some((ext) => item.name.endsWith(ext))) {
      files.push(fullPath)
    }
  }

  return files
}

function readFileContent(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isDynamicKey(key: string): boolean {
  return DYNAMIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function findKeyUsages(
  key: string,
  files: string[],
  fileContentsCache: Map<string, string>
): boolean {
  // Check if key matches dynamic pattern
  if (isDynamicKey(key)) {
    return true // Assume used
  }

  const escapedKey = escapeRegExp(key)

  // Patterns to search for:
  // 1. t('key') or t("key") or t(`key`)
  // 2. 'key' or "key" in translation context
  const patterns = [
    new RegExp(`t\\(['"\`]${escapedKey}['"\`]`, 'g'),
    new RegExp(`['"]${escapedKey}['"]`, 'g'),
  ]

  for (const file of files) {
    let content = fileContentsCache.get(file)
    if (!content) {
      content = readFileContent(file)
      fileContentsCache.set(file, content)
    }

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return true
      }
    }
  }

  return false
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return await new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

function removeKeysFromCatalog(
  keysToRemove: Set<string>,
  catalog: Record<string, string>
): Record<string, string> {
  const newCatalog: Record<string, string> = {}

  for (const [key, value] of Object.entries(catalog)) {
    if (!keysToRemove.has(key)) {
      newCatalog[key] = value
    }
  }

  return newCatalog
}

async function main(): Promise<void> {
  console.log('Finding unused translation keys...\n')

  if (!fs.existsSync(EN_LOCALE_PATH)) {
    console.error(`Error: English locale not found at ${EN_LOCALE_PATH}`)
    process.exit(1)
  }

  const catalogFiles = fs
    .readdirSync(EN_LOCALE_PATH)
    .filter(
      (fileName) =>
        fileName.endsWith('.json') && !EXCLUDED_LOCALE_FILES.has(fileName)
    )
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const filePath = path.join(EN_LOCALE_PATH, fileName)
      return {
        filePath,
        catalog: Schema.decodeUnknownSync(TranslationCatalog)(
          JSON.parse(readFileContent(filePath))
        ),
      }
    })
  const baseJson = Object.assign(
    {},
    ...catalogFiles.map(({catalog}) => catalog)
  )
  const allKeys = Object.keys(baseJson)

  console.log(
    `Found ${allKeys.length} translation keys in ${catalogFiles.length} English group files\n`
  )

  // Collect all source files to search
  const searchPaths = [MOBILE_SRC_PATH]
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  const allFiles: string[] = []

  for (const searchPath of searchPaths) {
    const files = getAllFiles(searchPath, extensions)
    allFiles.push(...files)
  }

  console.log(`Searching in ${allFiles.length} source files...\n`)

  // Cache for file contents to avoid re-reading
  const fileContentsCache = new Map<string, string>()

  // Find unused keys
  const unusedKeys: string[] = []
  const dynamicKeys: string[] = []

  for (const key of allKeys) {
    if (isDynamicKey(key)) {
      dynamicKeys.push(key)
      continue
    }

    const isUsed = findKeyUsages(key, allFiles, fileContentsCache)
    if (!isUsed) {
      unusedKeys.push(key)
    }
  }

  // Report results
  console.log('='.repeat(60))
  console.log('RESULTS')
  console.log('='.repeat(60))

  console.log(`\nTotal keys: ${allKeys.length}`)
  console.log(`Dynamic keys (assumed used): ${dynamicKeys.length}`)
  console.log(`Unused keys found: ${unusedKeys.length}`)

  if (unusedKeys.length > 0) {
    console.log('\n' + '-'.repeat(60))
    console.log('UNUSED KEYS:')
    console.log('-'.repeat(60))

    // Group by prefix for better readability
    const groupedKeys = new Map<string, string[]>()

    for (const key of unusedKeys) {
      const prefix = key.split('.')[0] ?? 'other'
      const group = groupedKeys.get(prefix) ?? []
      group.push(key)
      groupedKeys.set(prefix, group)
    }

    for (const [prefix, keys] of Array.from(groupedKeys.entries()).sort(
      (a, b) => a[0].localeCompare(b[0])
    )) {
      console.log(`\n[${prefix}] (${keys.length} keys):`)
      for (const key of keys.sort((a, b) => a.localeCompare(b))) {
        console.log(`  - ${key}`)
      }
    }

    console.log('\n' + '-'.repeat(60))
    console.log('JSON keys to delete (copy-paste ready):')
    console.log('-'.repeat(60))
    console.log(JSON.stringify(unusedKeys, null, 2))

    console.log('\n' + '='.repeat(60))
    console.log(
      'Note: Review dynamic key patterns in DYNAMIC_KEY_PREFIXES if you'
    )
    console.log('suspect false positives or negatives.')
    console.log('='.repeat(60))

    // Ask for confirmation to remove keys
    console.log('\n')
    const answer = await askQuestion(
      `Do you want to remove these ${unusedKeys.length} keys from their English group files? (yes/no): `
    )

    if (answer === 'yes' || answer === 'y') {
      console.log('\nRemoving unused keys from English group files...')

      const keysToRemove = new Set(unusedKeys)
      for (const {filePath, catalog} of catalogFiles) {
        const newCatalog = removeKeysFromCatalog(keysToRemove, catalog)
        if (Object.keys(newCatalog).length !== Object.keys(catalog).length) {
          fs.writeFileSync(
            filePath,
            JSON.stringify(newCatalog, null, 2) + '\n',
            'utf-8'
          )
        }
      }

      console.log(
        `\nSuccessfully removed ${unusedKeys.length} keys from English group files`
      )
      console.log(`New total: ${allKeys.length - unusedKeys.length} keys`)
    } else {
      console.log('\nNo changes made to English group files')
    }
  } else {
    console.log('\nNo unused keys found!')
    console.log('\n' + '='.repeat(60))
    console.log(
      'Note: Review dynamic key patterns in DYNAMIC_KEY_PREFIXES if you'
    )
    console.log('suspect false positives or negatives.')
    console.log('='.repeat(60))
  }
}

main().catch(console.error)
