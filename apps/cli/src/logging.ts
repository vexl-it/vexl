let logVerbose = false

export function setLogLevel(verbose: boolean): void {
  logVerbose = verbose
}

export function logOutput(message?: any, ...optionalParams: any[]): void {
  console.log(message, ...optionalParams)
}

export function logDebug(message?: any, ...optionalParams: any[]): void {
  if (logVerbose) console.debug(message, ...optionalParams)
}

export function logError(message?: any, ...optionalParams: any[]): void {
  console.error(message, ...optionalParams)
}
