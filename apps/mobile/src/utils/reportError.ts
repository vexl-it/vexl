import * as Sentry from '@sentry/react-native'
import {toJsonWithRemovedSensitiveData} from './removeSensitiveData'

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

function getConsoleLvl(
  logLvl: LogLvl
): (message: string, ...args: any[]) => void {
  if (logLvl === 'info') return console.info
  if (logLvl === 'warn') return console.warn
  if (logLvl === 'error' || logLvl === 'fatal')
    return console.error.bind('🚨 FATAL', console)

  return console.debug
}

function reportError(
  lvl: LogLvl,
  message: string,
  Error: any,
  ...args: any[]
): void
function reportError(lvl: LogLvl, message: string, ...args: any[]): void {
  if (!__DEV__) {
    Sentry.captureMessage(
      toJsonWithRemovedSensitiveData({lvl, message, args}),
      logLvlToSentryLvl(lvl)
    )
  }
  getConsoleLvl(lvl)(
    '‼️ there was an error reported. See hermes logs',
    message,
    JSON.stringify(args, null, 2)
  )
  getConsoleLvl(lvl)(message, ...args)
}

export default reportError
