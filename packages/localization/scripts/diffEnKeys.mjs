import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {jsonFiles, readFlattenedJson} from './localeUtils.mjs'

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)

export function diffEnDirs(baseDir, headDir) {
  const added = []
  const changed = []
  const removed = []

  const fileNames = [
    ...new Set([...jsonFiles(baseDir), ...jsonFiles(headDir)]),
  ].sort((left, right) => left.localeCompare(right))

  for (const fileName of fileNames) {
    const base = readFlattenedJson(baseDir, fileName) ?? new Map()
    const head = readFlattenedJson(headDir, fileName) ?? new Map()

    for (const [key, value] of head) {
      const baseValue = base.get(key)
      if (baseValue === undefined) {
        added.push({file: fileName, key, value})
      } else if (baseValue !== value) {
        changed.push({file: fileName, key, before: baseValue, after: value})
      }
    }
    for (const [key] of base) {
      if (!head.has(key)) removed.push({file: fileName, key})
    }
  }

  return {added, changed, removed}
}

function git(args) {
  return execFileSync('git', args, {cwd: packageRoot, encoding: 'utf8'})
}

function materializeBaseEnDir(ref, targetDir) {
  // Path form (relative to this package); an invalid ref throws, while a ref
  // that predates the locales/en layout just lists nothing.
  const fileNames = git(['ls-tree', '--name-only', ref, 'locales/en/'])
    .split('\n')
    .map((line) => path.basename(line))
    .filter((fileName) => fileName.endsWith('.json'))

  if (fileNames.length === 0) {
    console.error(
      `Note: ${ref} has no locales/en files; diffing against an empty base`
    )
    return
  }

  for (const fileName of fileNames) {
    fs.writeFileSync(
      path.join(targetDir, fileName),
      git(['show', `${ref}:./locales/en/${fileName}`])
    )
  }
}

function runCli() {
  const args = process.argv.slice(2)
  const baseIndex = args.indexOf('--base')
  const ref = baseIndex === -1 ? 'origin/main' : args[baseIndex + 1]
  if (ref === undefined) {
    console.error('Usage: node scripts/diffEnKeys.mjs [--base <git-ref>]')
    process.exitCode = 1
    return
  }

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vexl-en-base-'))
  try {
    materializeBaseEnDir(ref, baseDir)
    const diff = diffEnDirs(baseDir, path.join(packageRoot, 'locales', 'en'))
    console.log(JSON.stringify(diff, null, 2))
  } catch (error) {
    console.error(`diff:en failed: ${error.message}`)
    process.exitCode = 1
  } finally {
    fs.rmSync(baseDir, {recursive: true, force: true})
  }
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli()
}
