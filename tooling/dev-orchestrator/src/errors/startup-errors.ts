import {Data} from 'effect'

/**
 * Service process exited unexpectedly during startup.
 * This occurs when the service crashes before its health port becomes available.
 */
export class ServiceStartupFailure extends Data.TaggedError(
  'ServiceStartupFailure'
)<{
  readonly serviceName: string
  readonly exitCode: number
  readonly remediation: string
}> {
  get message(): string {
    return `Service '${this.serviceName}' failed to start (exit code ${this.exitCode})`
  }

  static make(serviceName: string, exitCode: number): ServiceStartupFailure {
    return new ServiceStartupFailure({
      serviceName,
      exitCode,
      remediation: `Check the ${serviceName} logs above for compilation or runtime errors`,
    })
  }
}

/**
 * Service health port did not respond within the timeout period.
 * This occurs when the service starts but takes too long to become ready.
 */
export class ServiceStartupTimeout extends Data.TaggedError(
  'ServiceStartupTimeout'
)<{
  readonly serviceName: string
  readonly port: number
  readonly timeoutMs: number
  readonly remediation: string
}> {
  get message(): string {
    return `Service '${this.serviceName}' did not respond on port ${this.port} within ${this.timeoutMs / 1000}s`
  }

  static make(
    serviceName: string,
    port: number,
    timeoutMs: number
  ): ServiceStartupTimeout {
    return new ServiceStartupTimeout({
      serviceName,
      port,
      timeoutMs,
      remediation:
        'Increase timeout or check service startup logs for slow initialization',
    })
  }
}

/**
 * Docker infrastructure failed to start.
 * This occurs when docker compose fails to bring up Postgres/Redis containers.
 */
export class DockerStartupError extends Data.TaggedError('DockerStartupError')<{
  readonly errorMessage: string
  readonly remediation: string
}> {
  get message(): string {
    return this.errorMessage
  }

  static make(errorMessage: string): DockerStartupError {
    return new DockerStartupError({
      errorMessage,
      remediation: 'Ensure Docker is running with `docker info`, then retry',
    })
  }
}

/**
 * Database seeding failed.
 * This occurs when creating service-specific databases fails.
 */
export class DbSeedError extends Data.TaggedError('DbSeedError')<{
  readonly errorMessage: string
  readonly remediation: string
}> {
  get message(): string {
    return this.errorMessage
  }

  static make(errorMessage: string): DbSeedError {
    return new DbSeedError({
      errorMessage,
      remediation:
        'Check database connection in .env.local and ensure Postgres is running',
    })
  }
}

/**
 * LAN IP address detection failed.
 * This occurs when trying to get the local network IP for physical device testing.
 */
export class LanIpDetectionError extends Data.TaggedError(
  'LanIpDetectionError'
)<{
  readonly reason: string
  readonly remediation: string
}> {
  get message(): string {
    return `Failed to detect LAN IP: ${this.reason}`
  }

  static make(reason: string): LanIpDetectionError {
    return new LanIpDetectionError({
      reason,
      remediation:
        'Check network connection or manually specify IP with --host flag',
    })
  }
}

/**
 * Expo dev server failed to start.
 * This occurs when spawning the Expo process fails or the Metro bundler port is in use.
 */
export class ExpoStartupError extends Data.TaggedError('ExpoStartupError')<{
  readonly reason: string
  readonly remediation: string
}> {
  get message(): string {
    return `Expo startup failed: ${this.reason}`
  }
}

/**
 * All Metro ports (8081-8090) are in use.
 * This occurs when too many dev:mobile instances are running simultaneously.
 */
export class MetroPortExhaustedError extends Data.TaggedError(
  'MetroPortExhaustedError'
)<{
  readonly range: string
  readonly remediation: string
}> {
  get message(): string {
    return `All Metro ports exhausted (${this.range}). Stop other dev:mobile instances.`
  }

  static make(): MetroPortExhaustedError {
    return new MetroPortExhaustedError({
      range: '8081-8090',
      remediation: 'Close other running dev:mobile terminals and retry',
    })
  }
}

/**
 * Union type of all startup-related errors for exhaustive handling.
 */
export type StartupError =
  | ServiceStartupFailure
  | ServiceStartupTimeout
  | DockerStartupError
  | DbSeedError
  | LanIpDetectionError
  | ExpoStartupError
  | MetroPortExhaustedError

/**
 * Format a startup error for display with actionable remediation guidance.
 *
 * Output format:
 * ```
 * [ERROR] {error.message}
 * Service: {serviceName}  (if applicable)
 *
 * Remediation: {error.remediation}
 * ```
 */
export const formatStartupError = (error: StartupError): string => {
  const lines: string[] = [`[ERROR] ${error.message}`]

  // Add service name if applicable
  switch (error._tag) {
    case 'ServiceStartupFailure':
    case 'ServiceStartupTimeout':
      lines.push(`Service: ${error.serviceName}`)
      break
    case 'DockerStartupError':
    case 'DbSeedError':
    case 'LanIpDetectionError':
    case 'ExpoStartupError':
    case 'MetroPortExhaustedError':
      // No service name for infrastructure/tooling errors
      break
  }

  // Add blank line and remediation
  lines.push('')
  lines.push(`Remediation: ${error.remediation}`)

  return lines.join('\n')
}
