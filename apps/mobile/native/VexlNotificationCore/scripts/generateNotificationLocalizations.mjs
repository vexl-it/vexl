#!/usr/bin/env node
/**
 * Generates Sources/VexlNotificationCore/Resources/notificationLocalizations.json
 * from packages/localization/<locale>-base.json.
 *
 * The NSE renders chat-notification previews natively (Swift) and needs the same
 * localized title/body strings the JS app uses (`notifications.<TYPE>.title/body`).
 * Only the message types the NSE may render a preview for are included.
 *
 * Run from anywhere: node scripts/generateNotificationLocalizations.mjs
 */
import {readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageDir, '../../../..')
const localizationDir = join(repoRoot, 'packages/localization')
const outFile = join(
  packageDir,
  'Sources/VexlNotificationCore/Resources/notificationLocalizations.json'
)

// Keep in sync with RenderableMessageType in
// Sources/VexlNotificationCore/Protocol/ChatMessagePayload.swift
const RENDERABLE_TYPES = [
  'MESSAGE',
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'CANCEL_REQUEST_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
  'INBOX_DELETED',
  'APPROVE_CONTACT_REVEAL',
  'DISAPPROVE_CONTACT_REVEAL',
  'REQUEST_CONTACT_REVEAL',
  'TRADE_CHECKLIST_UPDATE',
]

const result = {}

const files = readdirSync(localizationDir)
  .filter((f) => f.endsWith('-base.json'))
  .sort()

for (const file of files) {
  const locale = file.replace(/-base\.json$/, '')
  const content = JSON.parse(readFileSync(join(localizationDir, file), 'utf8'))
  const table = {}
  for (const type of RENDERABLE_TYPES) {
    const title = content[`notifications.${type}.title`]
    const body = content[`notifications.${type}.body`]
    if (typeof title === 'string' && typeof body === 'string') {
      table[type] = {title, body}
    }
  }
  if (Object.keys(table).length > 0) {
    result[locale] = table
  }
}

if (result.en == null) {
  throw new Error(
    'en locale missing - refusing to write a file without the fallback locale'
  )
}

writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`)
console.log(
  `Wrote ${outFile} (${Object.keys(result).length} locales: ${Object.keys(result).join(', ')})`
)
