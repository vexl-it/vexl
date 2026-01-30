import {Effect, Stream} from 'effect'
import {formatBadge} from '../ui/colors.js'
import {getLogBridge} from './log-bridge.js'

/**
 * Check if a log line is tsx internal messaging that should be suppressed.
 * tsx prints internal messages like "[tsx] Previous process hasn't exited yet. Force killing..."
 * which can appear at unexpected times due to async log processing and cause user confusion.
 */
const isTsxInternalMessage = (line: string): boolean => {
  return line.includes('[tsx]')
}

/**
 * Transform a byte stream into prefixed log lines.
 * Per CONTEXT.md: prefix on every line, no timestamps.
 */
export const transformLogStream = (
  stream: Stream.Stream<Uint8Array, Error>,
  serviceName: string
): Stream.Stream<string, Error> =>
  stream.pipe(
    Stream.decodeText(),
    Stream.splitLines,
    Stream.map((line) => {
      const badge = formatBadge(serviceName)
      return `${badge} ${line}`
    })
  )

/**
 * Pipe a transformed log stream to console and optionally to log bridge (TUI mode).
 * Runs as a fiber so it doesn't block.
 */
export const pipeLogsToConsole = (
  stream: Stream.Stream<Uint8Array, Error>,
  serviceName: string,
  isStderr: boolean = false
): Effect.Effect<void, never, never> =>
  stream.pipe(
    Stream.decodeText(),
    Stream.splitLines,
    // Filter out tsx internal messages that cause confusion
    Stream.filter((line) => !isTsxInternalMessage(line)),
    Stream.runForEach((line) =>
      Effect.sync(() => {
        // Check if TUI mode is active (logBridge exists)
        const logBridge = getLogBridge()

        if (logBridge !== null) {
          // TUI mode: emit to log bridge only (TUI manages display)
          logBridge.emitLog(serviceName, line, isStderr)
        } else {
          // Plain mode: write to console with formatted badge
          const badge = formatBadge(serviceName)
          const formatted = `${badge} ${line}`
          if (isStderr) {
            console.error(formatted)
          } else {
            console.log(formatted)
          }
        }
      })
    ),
    // Ignore errors from stream (process may have exited)
    Effect.catchAll(() => Effect.void),
    // Fork so it runs in background
    Effect.forkDaemon,
    Effect.asVoid
  )
