import pc from 'picocolors'
import {getLogBridge} from '../process/log-bridge.js'
import {formatBadge} from './colors.js'

/**
 * Log a message with a service prefix.
 * Per CONTEXT.md: no timestamps, colored badges, prefix on every line.
 * In TUI mode, emits to log bridge instead of console.
 */
export const logWithPrefix = (service: string, message: string): void => {
  const logBridge = getLogBridge()
  const lines = message.split('\n')

  if (logBridge !== null) {
    // TUI mode: emit to log bridge
    for (const line of lines) {
      logBridge.emitLog(service, line, false)
    }
  } else {
    // Plain mode: write to console
    const badge = formatBadge(service)
    for (const line of lines) {
      console.log(`${badge} ${line}`)
    }
  }
}

/**
 * Log an error message with red text.
 * In TUI mode, emits to log bridge with isError flag.
 */
export const logError = (service: string, message: string): void => {
  const logBridge = getLogBridge()
  const lines = message.split('\n')

  if (logBridge !== null) {
    // TUI mode: emit to log bridge with error flag
    for (const line of lines) {
      logBridge.emitLog(service, line, true)
    }
  } else {
    // Plain mode: write to console with red color
    const badge = formatBadge(service)
    for (const line of lines) {
      console.error(`${badge} ${pc.red(line)}`)
    }
  }
}

/**
 * Log a success message with green checkmark.
 * In TUI mode, emits to log bridge (checkmark included in message).
 */
export const logSuccess = (service: string, message: string): void => {
  const logBridge = getLogBridge()

  if (logBridge !== null) {
    // TUI mode: emit to log bridge (include checkmark in message)
    logBridge.emitLog(service, `${pc.green('\u2713')} ${message}`, false)
  } else {
    // Plain mode: write to console
    const badge = formatBadge(service)
    console.log(`${badge} ${pc.green('\u2713')} ${message}`)
  }
}

/**
 * Log an info message (no special formatting).
 */
export const logInfo = (service: string, message: string): void => {
  logWithPrefix(service, message)
}
