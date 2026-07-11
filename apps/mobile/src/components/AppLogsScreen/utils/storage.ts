/**
 * We don't use atoms here to make it at least somewhat performant. Logs are
 * kept as a ring buffer capped at MAX_LOG_LINES lines (cached in memory so we
 * don't re-read and re-split the whole blob on every stored line).
 */
import {registerMmkvKey} from '../../../utils/atomUtils/mmkvMigrationRegistry'
import {storage} from '../../../utils/mmkv/effectMmkv'

export const LOGS_KEY = 'logs'
export const IS_CUSTOM_LOGGKING_ENABLED_KEY = 'logs_enabled'

registerMmkvKey({
  key: LOGS_KEY,
  policy: 'deviceLocal',
  nativeType: 'string',
})
registerMmkvKey({
  key: IS_CUSTOM_LOGGKING_ENABLED_KEY,
  policy: 'deviceLocal',
  nativeType: 'boolean',
})

const MAX_LOG_LINES = 1_000

let cachedLogLines: string[] | undefined

function getLogLines(): string[] {
  if (cachedLogLines === undefined) {
    const raw = storage._storage.getString(LOGS_KEY)
    cachedLogLines = raw ? raw.split('\n') : []
  }
  return cachedLogLines
}

export function setCustomLoggingEnabled(enabled: boolean): void {
  storage._storage.set(IS_CUSTOM_LOGGKING_ENABLED_KEY, enabled)
}

export function getCustomLoggingEnabled(): boolean {
  return storage._storage.getBoolean(IS_CUSTOM_LOGGKING_ENABLED_KEY) ?? false
}

export function readLogs(): string[] {
  return getLogLines()
}

export function readLogsRaw(): string {
  const logs = storage._storage.getString(LOGS_KEY)
  return logs !== undefined && logs !== '' ? logs : '[[NO LOGS YET]]'
}

export function storeLog(logMessage: string): void {
  cachedLogLines = [...getLogLines(), logMessage].slice(-MAX_LOG_LINES)
  storage._storage.set(LOGS_KEY, cachedLogLines.join('\n'))
}

export function clearLogs(): void {
  cachedLogLines = []
  storage._storage.delete(LOGS_KEY)
}

export function listenOnAppLogs(
  listener: (logs: string[]) => void
): () => void {
  return storage._storage.addOnValueChangedListener((key) => {
    if (key !== LOGS_KEY) return
    const logs = readLogs()
    listener(logs)
  }).remove
}
