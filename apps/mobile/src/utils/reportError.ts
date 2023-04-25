export type LogLvl = 'info' | 'warn' | 'error'

function getConsoleLvl(
  logLvl: LogLvl
): (message: string, ...args: any[]) => void {
  if (logLvl === 'info') return console.info
  if (logLvl === 'warn') return console.warn
  if (logLvl === 'error') return console.error

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
    // toDO crashlitics
  }
  getConsoleLvl(lvl)('‼️ there was an error reported. See hermes logs')
  getConsoleLvl(lvl)(message, ...args)
}

export default reportError
