import * as Sentry from '@sentry/react-native'
import {initReportError} from '@vexl-next/resources-utils/src/reportErrorFromResourcesUtils'
import {Effect} from 'effect'
import {toExtraWithRemovedSensitiveData} from './removeSensitiveData'

export type LogLvl = 'info' | 'warn' | 'error' | 'fatal'
export type SeverityLevel =
  | 'fatal'
  | 'error'
  | 'warning'
  | 'log'
  | 'info'
  | 'debug'

function logLvlToSentryLvl(logLvl: LogLvl): SeverityLevel {
  if (logLvl === 'info') return 'info'
  if (logLvl === 'warn') return 'warning'
  if (logLvl === 'error') return 'error'
  if (logLvl === 'fatal') return 'fatal'

  return 'fatal'
}

function getConsoleLvl(logLvl: LogLvl): (...args: any[]) => void {
  if (logLvl === 'info') return console.info
  if (logLvl === 'warn') return console.warn
  if (logLvl === 'error' || logLvl === 'fatal')
    return console.error.bind('🚨 FATAL', console)

  return console.debug
}

function reportError(
  lvl: LogLvl,
  error: Error,
  extra?: Record<string, unknown>
): void {
  if (!__DEV__) {
    Sentry.captureException(error, {
      level: logLvlToSentryLvl(lvl),
      extra: extra ? toExtraWithRemovedSensitiveData(extra) : undefined,
    })
  }
  getConsoleLvl(lvl)(
    '‼️ there was an error reported. See hermes logs',
    error,
    JSON.stringify(extra, null, 2)
  )
  getConsoleLvl(lvl)(error, extra)
}

export default reportError

export const reportErrorE = (
  lvl: LogLvl,
  error: Error,
  extra?: Record<string, unknown>
): Effect.Effect<void> =>
  Effect.sync(() => {
    reportError(lvl, error, extra)
  })

export const ignoreReportErrors =
  (lvl: LogLvl, message: string) =>
  <A, E, R>(self: Effect.Effect<A, E, R>) =>
    self.pipe(
      Effect.tapError((e) =>
        reportErrorE(lvl, new Error(message, {cause: e}), {e})
      ),
      Effect.ignore
    )

initReportError(reportError)
