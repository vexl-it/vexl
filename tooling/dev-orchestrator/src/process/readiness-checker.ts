import {Effect} from 'effect'
import tcpPortUsed from 'tcp-port-used'
import {ServiceStartupTimeout} from '../errors/index.js'

// Re-export for existing importers
export {ServiceStartupTimeout}

/**
 * Wait for a service to be ready by checking if its health port is listening.
 * Per RESEARCH.md: TCP port check is sufficient for "accepting connections".
 *
 * @param serviceName - For error messages
 * @param port - Health port to check
 * @param timeoutMs - Maximum wait time (default 30 seconds)
 * @param retryIntervalMs - Time between checks (default 500ms)
 */
export const waitForServiceReady = (
  serviceName: string,
  port: number,
  timeoutMs: number = 30000,
  retryIntervalMs: number = 500
): Effect.Effect<void, ServiceStartupTimeout> =>
  Effect.tryPromise({
    try: async () => {
      await tcpPortUsed.waitUntilUsed(port, retryIntervalMs, timeoutMs)
    },
    catch: () =>
      new ServiceStartupTimeout({
        serviceName,
        port,
        timeoutMs,
        remediation: `Check ${serviceName} logs for slow startup or increase timeout`,
      }),
  })

/**
 * Check if a port is currently in use.
 */
export const isPortInUse = (port: number): Effect.Effect<boolean> =>
  Effect.tryPromise({
    try: async () => await tcpPortUsed.check(port, '127.0.0.1'),
    catch: () => new Error('Port check failed'),
  }).pipe(Effect.catchAll(() => Effect.succeed(false)))
