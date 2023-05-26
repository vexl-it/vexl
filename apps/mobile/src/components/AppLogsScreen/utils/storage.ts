/**
 * We don't use atoms here to make it at least somewhat performant. We assume storing 1_000 log lines
 */
import {storage} from '../../../utils/fpMmkv'

export const LOGS_KEY = 'logs'
export const IS_CUSTOM_LOGGKING_ENABLED_KEY = 'logs_enabled'

export function setCustomLoggingEnabled(enabled: boolean): void {
  storage._storage.set(IS_CUSTOM_LOGGKING_ENABLED_KEY, enabled)
}

export function getCustomLoggingEnabled(): boolean {
  return storage._storage.getBoolean(IS_CUSTOM_LOGGKING_ENABLED_KEY) ?? false
}

export function readLogs(): string[] {
  return storage._storage.getString(LOGS_KEY)?.split('\n') ?? []
}

export function readLogsRaw(): string {
  return storage._storage.getString(LOGS_KEY) ?? '[[NO LOGS YET]]'
}

export function storeLog(logMessage: string): void {
  const logsSoFar = storage._storage.getString(LOGS_KEY)
  if (logsSoFar) {
    storage._storage.set(LOGS_KEY, logsSoFar + `\n${logMessage}`)
  } else {
    storage._storage.set(LOGS_KEY, logMessage)
  }
}

export function clearLogs(): void {
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
