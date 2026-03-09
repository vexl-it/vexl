import {Effect} from 'effect'
import {appendFileSync, mkdirSync, rmSync} from 'node:fs'
import {join} from 'node:path'
import {findProjectRoot} from '../config/env-loader.js'

interface StructuredLogLine {
  readonly timestamp: string
  readonly service: string
  readonly stream: 'stdout' | 'stderr'
  readonly message: string
}

const getBackendLogDirectory = (): string =>
  join(findProjectRoot(), 'local', 'dev-orchestrator', 'logs')

const getServiceLogPath = (serviceName: string): string =>
  join(getBackendLogDirectory(), `${serviceName}.log`)

export const prepareBackendLogDirectory = Effect.sync(() => {
  const logDirectory = getBackendLogDirectory()
  rmSync(logDirectory, {recursive: true, force: true})
  mkdirSync(logDirectory, {recursive: true})
})

export const writeStructuredServiceLog = (
  serviceName: string,
  stream: 'stdout' | 'stderr',
  message: string
): void => {
  const line: StructuredLogLine = {
    timestamp: new Date().toISOString(),
    service: serviceName,
    stream,
    message,
  }

  try {
    mkdirSync(getBackendLogDirectory(), {recursive: true})
    appendFileSync(getServiceLogPath(serviceName), `${JSON.stringify(line)}\n`)
  } catch {
    // Local file mirroring is best-effort and must not break service logs.
  }
}
