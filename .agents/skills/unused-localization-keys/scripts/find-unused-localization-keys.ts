#!/usr/bin/env tsx

import {existsSync, readFileSync, statSync, writeFileSync} from 'node:fs'
import {readdir} from 'node:fs/promises'
import path from 'node:path'

type CliOptions = {
  readonly repoRoot: string
  readonly baseJsonPath: string
  readonly scanPaths: ReadonlyArray<string>
  readonly fix: boolean
  readonly json: boolean
}

type SourceFile = {
  readonly absolutePath: string
  readonly relativePath: string
  readonly text: string
}

type UsageReport = {
  readonly totalKeys: number
  readonly usedKeys: ReadonlyArray<string>
  readonly unusedKeys: ReadonlyArray<string>
  readonly dynamicPrefixes: ReadonlyArray<string>
  readonly scannedFiles: number
  readonly scanPaths: ReadonlyArray<string>
}

type RemovalReport = {
  readonly baseJsonPath: string
  readonly localeJsonPaths: ReadonlyArray<string>
}

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'])

const ignoredPathSegments = new Set([
  '.expo',
  '.git',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
])

function printHelp(): void {
  console.log(`Find unused keys in packages/localization/base.json.

Usage:
  yarn tsx .agents/skills/unused-localization-keys/scripts/find-unused-localization-keys.ts [options]

Options:
  --fix                  Remove unused keys from base.json and sibling *-base.json files.
  --json                 Print machine-readable JSON.
  --base <path>          Path to base.json. Default: packages/localization/base.json
  --scan <path>          Path to scan. Can be repeated. Default: apps/mobile/src
  --repo-root <path>     Repository root. Default: current working directory.
  --help                 Show this help.
`)
}

function parseArgs(argv: ReadonlyArray<string>): CliOptions {
  let repoRoot = process.cwd()
  let baseJsonPath = 'packages/localization/base.json'
  const scanPaths: Array<string> = []
  let fix = false
  let json = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--fix') {
      fix = true
    } else if (arg === '--json') {
      json = true
    } else if (arg === '--help') {
      printHelp()
      process.exit(0)
    } else if (arg === '--base' || arg === '--scan' || arg === '--repo-root') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error(`Missing value for ${arg}`)
      }

      if (arg === '--base') {
        baseJsonPath = value
      } else if (arg === '--scan') {
        scanPaths.push(value)
      } else {
        repoRoot = value
      }

      index += 1
    } else {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return {
    repoRoot: path.resolve(repoRoot),
    baseJsonPath,
    scanPaths: scanPaths.length > 0 ? scanPaths : ['apps/mobile/src'],
    fix,
    json,
  }
}

function resolveFromRepo(repoRoot: string, maybeRelativePath: string): string {
  if (path.isAbsolute(maybeRelativePath)) return maybeRelativePath
  return path.join(repoRoot, maybeRelativePath)
}

async function collectSourceFiles(
  repoRoot: string,
  scanPaths: ReadonlyArray<string>
): Promise<ReadonlyArray<SourceFile>> {
  const files: Array<SourceFile> = []

  async function visit(absolutePath: string): Promise<void> {
    const name = path.basename(absolutePath)
    if (ignoredPathSegments.has(name)) return

    const stats = statSync(absolutePath)
    if (stats.isDirectory()) {
      const children = await readdir(absolutePath)
      for (const child of children) {
        await visit(path.join(absolutePath, child))
      }
      return
    }

    if (!stats.isFile()) return
    if (!sourceExtensions.has(path.extname(absolutePath))) return

    files.push({
      absolutePath,
      relativePath: path.relative(repoRoot, absolutePath),
      text: readFileSync(absolutePath, 'utf8'),
    })
  }

  for (const scanPath of scanPaths) {
    const absolutePath = resolveFromRepo(repoRoot, scanPath)
    if (!existsSync(absolutePath)) {
      throw new Error(`Scan path does not exist: ${scanPath}`)
    }
    await visit(absolutePath)
  }

  return files
}

function readBaseKeys(absoluteBaseJsonPath: string): ReadonlyArray<string> {
  const parsed = JSON.parse(readFileSync(absoluteBaseJsonPath, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected base.json to be a flat JSON object.')
  }

  return Object.keys(parsed).sort()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractStaticTranslationKeys(text: string): ReadonlySet<string> {
  const keys = new Set<string>()
  const callPattern = /(?:^|[^\w$])(?:t|i18n\.t)\(\s*(['"])([A-Za-z0-9_.-]+)\1/g
  let match = callPattern.exec(text)

  while (match) {
    keys.add(match[2])
    match = callPattern.exec(text)
  }

  return keys
}

function extractDynamicPrefixes(text: string): ReadonlySet<string> {
  const prefixes = new Set<string>()
  const templateCallPattern =
    /(?:^|[^\w$])(?:t|i18n\.t)\(\s*`([A-Za-z0-9_.-]*\$\{[^`]+`)/g
  let match = templateCallPattern.exec(text)

  while (match) {
    const templateText = match[1]
    const interpolationIndex = templateText.indexOf('${')
    const prefix = templateText.slice(0, interpolationIndex)

    if (prefix) prefixes.add(prefix)
    match = templateCallPattern.exec(text)
  }

  return prefixes
}

function extractQuotedKeyOccurrences(
  text: string,
  baseKeys: ReadonlyArray<string>
): ReadonlySet<string> {
  const keys = new Set<string>()

  for (const key of baseKeys) {
    const pattern = new RegExp(`(['"\`])${escapeRegExp(key)}\\1`)
    if (pattern.test(text)) keys.add(key)
  }

  return keys
}

function buildUsageReport(
  baseKeys: ReadonlyArray<string>,
  files: ReadonlyArray<SourceFile>,
  scanPaths: ReadonlyArray<string>
): UsageReport {
  const usedKeys = new Set<string>()
  const dynamicPrefixes = new Set<string>()

  for (const file of files) {
    for (const key of extractStaticTranslationKeys(file.text)) {
      usedKeys.add(key)
    }

    for (const key of extractQuotedKeyOccurrences(file.text, baseKeys)) {
      usedKeys.add(key)
    }

    for (const prefix of extractDynamicPrefixes(file.text)) {
      dynamicPrefixes.add(prefix)
    }
  }

  for (const key of baseKeys) {
    for (const prefix of dynamicPrefixes) {
      if (key.startsWith(prefix)) usedKeys.add(key)
    }
  }

  const usedBaseKeys = baseKeys.filter((key) => usedKeys.has(key))
  const unusedKeys = baseKeys.filter((key) => !usedKeys.has(key))

  return {
    totalKeys: baseKeys.length,
    usedKeys: usedBaseKeys,
    unusedKeys,
    dynamicPrefixes: [...dynamicPrefixes].sort(),
    scannedFiles: files.length,
    scanPaths,
  }
}

function printReport(report: UsageReport): void {
  console.log(`Scanned files: ${report.scannedFiles}`)
  console.log(`Total base.json keys: ${report.totalKeys}`)
  console.log(`Used keys: ${report.usedKeys.length}`)
  console.log(`Unused keys: ${report.unusedKeys.length}`)

  if (report.dynamicPrefixes.length > 0) {
    console.log('\nDynamic prefixes kept:')
    for (const prefix of report.dynamicPrefixes) {
      console.log(`  ${prefix}*`)
    }
  }

  if (report.unusedKeys.length > 0) {
    console.log('\nUnused keys:')
    for (const key of report.unusedKeys) {
      console.log(`  ${key}`)
    }
  }
}

async function collectLocaleBaseJsonPaths(
  absoluteBaseJsonPath: string
): Promise<ReadonlyArray<string>> {
  const localizationDirectory = path.dirname(absoluteBaseJsonPath)
  const baseJsonFileName = path.basename(absoluteBaseJsonPath)
  const fileNames = await readdir(localizationDirectory)

  return fileNames
    .filter(
      (fileName) =>
        fileName.endsWith('-base.json') && fileName !== baseJsonFileName
    )
    .sort()
    .map((fileName) => path.join(localizationDirectory, fileName))
}

function removeUnusedKeys(
  absoluteJsonPath: string,
  unusedKeys: ReadonlyArray<string>
): boolean {
  const parsed = JSON.parse(readFileSync(absoluteJsonPath, 'utf8'))
  const unused = new Set(unusedKeys)
  const nextBaseJson: Record<string, unknown> = {}
  let removedAnyKey = false

  for (const key of Object.keys(parsed)) {
    if (!unused.has(key)) {
      nextBaseJson[key] = parsed[key]
    } else {
      removedAnyKey = true
    }
  }

  if (removedAnyKey) {
    writeFileSync(
      absoluteJsonPath,
      `${JSON.stringify(nextBaseJson, null, 2)}\n`,
      'utf8'
    )
  }

  return removedAnyKey
}

async function removeUnusedKeysFromLocalizationFiles(
  repoRoot: string,
  absoluteBaseJsonPath: string,
  unusedKeys: ReadonlyArray<string>
): Promise<RemovalReport> {
  const localeJsonPaths = await collectLocaleBaseJsonPaths(absoluteBaseJsonPath)
  const changedLocaleJsonPaths: Array<string> = []
  const baseJsonChanged = removeUnusedKeys(absoluteBaseJsonPath, unusedKeys)

  for (const localeJsonPath of localeJsonPaths) {
    if (removeUnusedKeys(localeJsonPath, unusedKeys)) {
      changedLocaleJsonPaths.push(path.relative(repoRoot, localeJsonPath))
    }
  }

  return {
    baseJsonPath: baseJsonChanged
      ? path.relative(repoRoot, absoluteBaseJsonPath)
      : '',
    localeJsonPaths: changedLocaleJsonPaths,
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const absoluteBaseJsonPath = resolveFromRepo(
    options.repoRoot,
    options.baseJsonPath
  )

  if (!existsSync(absoluteBaseJsonPath)) {
    throw new Error(`Base JSON file does not exist: ${options.baseJsonPath}`)
  }

  const baseKeys = readBaseKeys(absoluteBaseJsonPath)
  const files = await collectSourceFiles(options.repoRoot, options.scanPaths)
  const report = buildUsageReport(baseKeys, files, options.scanPaths)

  const removalReport =
    options.fix && report.unusedKeys.length > 0
      ? await removeUnusedKeysFromLocalizationFiles(
          options.repoRoot,
          absoluteBaseJsonPath,
          report.unusedKeys
        )
      : undefined

  if (options.json) {
    console.log(JSON.stringify({...report, removalReport}, null, 2))
  } else {
    printReport(report)
    if (options.fix) {
      console.log(
        `\nRemoved ${report.unusedKeys.length} unused keys from ${options.baseJsonPath}.`
      )
      if (removalReport && removalReport.localeJsonPaths.length > 0) {
        console.log(
          `Also removed matching keys from ${removalReport.localeJsonPaths.length} locale files.`
        )
      }
    } else {
      console.log(
        '\nRun with --fix to remove the unused keys from base.json and sibling *-base.json files.'
      )
    }
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exit(1)
})
