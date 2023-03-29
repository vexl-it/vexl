import fs from 'node:fs'

let logVerbose = false

function checkIfFd3IsOpen() {
  try {
    return fs.fstatSync(3).dev !== 0
  } catch (e) {
    return false
  }
}

export const fd3isOpen = checkIfFd3IsOpen()

export function setLogLevel(verbose: boolean): void {
  console.log('Setting verbose', {verbose})
  logVerbose = verbose
}

export function logOutput(message?: any, ...optionalParams: any[]): void {
  console.log(message, ...optionalParams)
  if (fd3isOpen) fs.writeSync(3, message)
}

export function logDebug(message?: any, ...optionalParams: any[]): void {
  if (logVerbose) console.debug(message, ...optionalParams)
}

export function logError(message?: any, ...optionalParams: any[]): void {
  console.error(message, ...optionalParams)
}
