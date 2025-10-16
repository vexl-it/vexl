import {isStaging} from '../../../utils/environment'
import isString from '../../../utils/isString'
import safeToJson from './safeToJson'
import {getCustomLoggingEnabled, storeLog} from './storage'

const initialLogMethods = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
}

type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error'

function log(lvl: LogLevel, ...args: unknown[]): void {
  const logMessage = `${new Date().toISOString()} - [${lvl}]: ${args
    .map((oneArg) => {
      if (isString(oneArg)) return oneArg
      if (oneArg === null) return '[[null]]'
      if (oneArg === undefined) return '[[undefined]]'
      return safeToJson(oneArg)
    })
    .join(' ')}`

  if (__DEV__) initialLogMethods[lvl](...args) // Log to console only in dev mode

  storeLog(logMessage)
}

export function setupAppLogs(): void {
  if (getCustomLoggingEnabled()) {
    // If enabled use custom logging
    console.log = (...args: unknown[]) => {
      log('log', ...args)
    }
    console.info = (...args: unknown[]) => {
      log('info', ...args)
    }
    console.debug = (...args: unknown[]) => {
      log('debug', ...args)
    }
    console.warn = (...args: unknown[]) => {
      log('warn', ...args)
    }
    console.error = (...args: unknown[]) => {
      log('error', ...args)
    }
  } else if (__DEV__ || isStaging) {
    // Log to console only in dev mode
    console.log = initialLogMethods.log
    console.info = initialLogMethods.info
    console.debug = initialLogMethods.debug
    console.warn = initialLogMethods.warn
    console.error = initialLogMethods.error
  } else {
    // Clear logs in all other cases - performance, baby!
    console.log = () => {}
    console.info = () => {}
    console.debug = () => {}
    console.warn = () => {}
    console.error = () => {}
  }
}
