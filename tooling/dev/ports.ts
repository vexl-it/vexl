/**
 * Port helpers: resolve effective ports (honoring env overrides), detect
 * duplicate assignments, and check whether a TCP port is free.
 */
import {createServer} from 'node:net'

export function camelToScreamingSnake(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toUpperCase()
}

/**
 * For each port key, the override env var is `<SCREAMING_SNAKE(key)>_PORT`
 * (e.g. `userService` -> `USER_SERVICE_PORT`, `postgres` -> `POSTGRES_PORT`,
 * `grafana` -> `GRAFANA_PORT`). docker-compose.dev.yaml uses the same names.
 */
export function portEnvVar(key: string): string {
  return `${camelToScreamingSnake(key)}_PORT`
}

const legacyPortEnvVars: Readonly<Record<string, string>> = {
  webApp: 'ACCOUNT_DELETION_WEBSITE_PORT',
}

export function isValidTcpPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65_535
}

export function resolvePorts(
  base: Record<string, number>,
  env: Record<string, string | undefined>
): Record<string, number> {
  const resolved: Record<string, number> = {}
  for (const [key, value] of Object.entries(base)) {
    const legacyEnvVar = legacyPortEnvVars[key]
    const override =
      env[portEnvVar(key)] ??
      (legacyEnvVar !== undefined ? env[legacyEnvVar] : undefined)
    const parsed =
      override !== undefined && override.trim().length > 0
        ? Number(override)
        : Number.NaN
    resolved[key] = isValidTcpPort(parsed) ? parsed : value
  }
  return resolved
}

export interface PortAssignment {
  readonly label: string
  readonly port: number
}

export function findDuplicatePorts(
  assignments: readonly PortAssignment[]
): ReadonlyArray<{port: number; labels: string[]}> {
  const byPort = new Map<number, string[]>()
  for (const {label, port} of assignments) {
    const labels = byPort.get(port) ?? []
    labels.push(label)
    byPort.set(port, labels)
  }
  const duplicates: Array<{port: number; labels: string[]}> = []
  for (const [port, labels] of byPort.entries()) {
    if (labels.length > 1) duplicates.push({port, labels})
  }
  return duplicates
}

export async function isPortFree(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const server = createServer()
    server.once('error', () => {
      resolve(false)
    })
    server.once('listening', () => {
      server.close(() => {
        resolve(true)
      })
    })
    server.listen(port, '127.0.0.1')
  })
}
