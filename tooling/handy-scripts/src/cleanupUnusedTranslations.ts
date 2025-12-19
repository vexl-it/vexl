#!/usr/bin/env npx tsx

/**
 * Script to find and cleanup unused translation keys in the codebase.
 *
 * Usage:
 *   yarn workspace @vexl-next/handy-scripts cleanup-unused-translations
 *
 * What it does:
 *   1. Reads all keys from packages/localization/base.json
 *   2. Searches for usages in apps/mobile/src/**
 *   3. Reports keys that are not found in the codebase
 *   4. Asks for confirmation and removes unused keys from base.json
 *
 * Note: Some keys are used dynamically (e.g., `t(`currency.${code}`)`)
 *       The script detects common dynamic patterns and excludes those prefixes.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {fileURLToPath} from 'url'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)

const REPO_ROOT = path.resolve(currentDirPath, '../../..')
const BASE_JSON_PATH = path.join(REPO_ROOT, 'packages/localization/base.json')
const MOBILE_SRC_PATH = path.join(REPO_ROOT, 'apps/mobile/src')

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
]

// Additional files/directories to search (besides mobile)
const ADDITIONAL_SEARCH_PATHS = [
  path.join(REPO_ROOT, 'apps/dashboard-client/src'),
  path.join(REPO_ROOT, 'apps/vexl-website/src'),
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

function removeKeysFromBaseJson(
  keysToRemove: string[],
  baseJson: Record<string, string>
): Record<string, string> {
  const keysSet = new Set(keysToRemove)
  const newBaseJson: Record<string, string> = {}

  for (const [key, value] of Object.entries(baseJson)) {
    if (!keysSet.has(key)) {
      newBaseJson[key] = value
    }
  }

  return newBaseJson
}

async function main(): Promise<void> {
  console.log('Finding unused translation keys...\n')

  // Read base.json
  if (!fs.existsSync(BASE_JSON_PATH)) {
    console.error(`Error: base.json not found at ${BASE_JSON_PATH}`)
    process.exit(1)
  }

  const baseJson = JSON.parse(readFileContent(BASE_JSON_PATH)) as Record<
    string,
    string
  >
  const allKeys = Object.keys(baseJson)

  console.log(`Found ${allKeys.length} translation keys in base.json\n`)

  // Collect all source files to search
  const searchPaths = [MOBILE_SRC_PATH, ...ADDITIONAL_SEARCH_PATHS]
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
      `Do you want to remove these ${unusedKeys.length} keys from base.json? (yes/no): `
    )

    if (answer === 'yes' || answer === 'y') {
      console.log('\nRemoving unused keys from base.json...')

      const newBaseJson = removeKeysFromBaseJson(unusedKeys, baseJson)
      const newContent = JSON.stringify(newBaseJson, null, 2) + '\n'

      fs.writeFileSync(BASE_JSON_PATH, newContent, 'utf-8')

      console.log(
        `\nSuccessfully removed ${unusedKeys.length} keys from base.json`
      )
      console.log(`New total: ${Object.keys(newBaseJson).length} keys`)
    } else {
      console.log('\nNo changes made to base.json')
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
