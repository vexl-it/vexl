type LogLvl = 'info' | 'warn' | 'error' | 'fatal'

type ReportErrorFunction = (
  lvl: LogLvl,
  error: Error,
  extra?: Record<string, unknown>
) => void

let reportErrorFunction: ReportErrorFunction = (lvl, error, extra) => {
  console.warn('Report Error function not initialized in resourcesUtils.')

  const functionToCall = (() => {
    if (lvl === 'error' || lvl === 'fatal') {
      return console.error
    }
    if (lvl === 'warn') {
      return console.warn
    }
    return console.info
  })()
  functionToCall(error, extra)
}

const reportErrorFromResourcesUtils: ReportErrorFunction = (...args) => {
  reportErrorFunction(...args)
}

export default reportErrorFromResourcesUtils

export const initReportError = (reportError: ReportErrorFunction): void => {
  reportErrorFunction = reportError
}
