import type {CommandExecutor, Error as PlatformError} from '@effect/platform'
import {Command} from '@effect/platform'
import type {Scope} from 'effect'
import {Effect, Fiber} from 'effect'
import type {DevConfig} from '../config/dev-config-schema.js'
import {toScreamingSnake, toServiceKey} from '../config/dev-config-schema.js'
import {findProjectRoot} from '../config/env-loader.js'
import type {ServiceConfig} from '../config/services.js'
import {
  ServiceStartupFailure,
  type ServiceStartupTimeout,
} from '../errors/index.js'
import {logError, logSuccess, logWithPrefix} from '../ui/logger.js'
import {pipeLogsToConsole} from './log-transformer.js'
import {waitForServiceReady} from './readiness-checker.js'
import {getStartupState} from './startup-state.js'

/**
 * Generate service-specific DB_URL by replacing database name in URL.
 * Per RESEARCH.md: Uses URL API for parsing, replaces path with service-specific database.
 *
 * Example: "postgresql://localhost:5432/vexl-dev" -> "postgresql://localhost:5432/vexl_user_service"
 */
const generateServiceDbUrl = (baseUrl: string, serviceName: string): string => {
  const url = new URL(baseUrl)
  const dbName = `vexl_${serviceName.replace(/-/g, '_')}`
  url.pathname = `/${dbName}`
  return url.toString()
}

/**
 * Error when loading devConfig.ts fails.
 */
export class DevConfigLoadError {
  readonly _tag = 'DevConfigLoadError'
  constructor(readonly message: string) {}
}

/**
 * Load devConfig.ts from project root.
 * This file contains environment variable configuration for all services.
 */
const loadDevConfig = (): Effect.Effect<DevConfig, DevConfigLoadError> =>
  Effect.tryPromise({
    try: async () => {
      const root = findProjectRoot()
      const module = (await import(`${root}/devConfig.ts`)) as {
        default: DevConfig
      }
      return module.default
    },
    catch: (e) =>
      new DevConfigLoadError(
        `Failed to load devConfig.ts: ${e instanceof Error ? e.message : String(e)}`
      ),
  })

/**
 * Build environment variables for a service by merging:
 * 1. process.env (includes .env.local secrets)
 * 2. devConfig.common (infrastructure defaults)
 * 3. devConfig[serviceKey] (service-specific overrides)
 * 4. Orchestrator-managed values (PORT, HEALTH_PORT, SERVICE_NAME, DB_URL)
 *
 * Later layers override earlier ones. Undefined values are filtered out.
 * Per Phase 2.2: Each service with needsDatabase gets its own database.
 */
const buildServiceEnv = (
  config: ServiceConfig,
  devConfig: DevConfig
): Record<string, string> => {
  const serviceKey = toServiceKey(config.name) as keyof DevConfig
  const serviceEnv = devConfig[serviceKey] ?? {}

  // Filter out undefined values from serviceEnv
  const filteredServiceEnv = Object.fromEntries(
    Object.entries(serviceEnv).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  )

  // Filter out undefined values from common
  const filteredCommon = Object.fromEntries(
    Object.entries(devConfig.common).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  )

  // Generate service-specific DB_URL if service needs database
  // Per Phase 2.2: Each service gets its own database
  const baseDbUrl =
    filteredServiceEnv.DB_URL ??
    filteredCommon.DB_URL ??
    devConfig.common.DB_URL ??
    process.env.DB_URL ??
    'postgresql://localhost:5432/vexl-dev'
  const serviceDbUrl = config.needsDatabase
    ? generateServiceDbUrl(baseDbUrl, config.name)
    : baseDbUrl

  return {
    // Base: existing process.env (includes .env.local secrets)
    ...(process.env as Record<string, string>),
    // Layer: common config (filtered)
    ...filteredCommon,
    // Layer: service-specific config (filtered)
    ...filteredServiceEnv,
    // Override: orchestrator-managed values (always set)
    PORT: String(config.port),
    HEALTH_PORT: String(config.healthPort),
    SERVICE_NAME: toScreamingSnake(config.name),
    // Override: service-specific DB_URL (if needs database)
    DB_URL: serviceDbUrl,
  }
}

export class ServiceSpawnError {
  readonly _tag = 'ServiceSpawnError'
  constructor(
    readonly serviceName: string,
    readonly message: string
  ) {}
}

/**
 * Handle for a running service process.
 */
export interface ServiceProcess {
  readonly config: ServiceConfig
  readonly exitCode: Effect.Effect<
    CommandExecutor.ExitCode,
    PlatformError.PlatformError
  >
  readonly kill: Effect.Effect<void, PlatformError.PlatformError>
}

/**
 * Spawn a single service using tsx watch for hot reload.
 * Per RESEARCH.md: invoke tsx watch directly, not yarn dev.
 * Per CONTEXT.md: orchestrator delegates file watching to tsx.
 *
 * Returns a ServiceProcess handle for monitoring and cleanup.
 */
export const spawnService = (
  config: ServiceConfig
): Effect.Effect<
  ServiceProcess,
  | DevConfigLoadError
  | ServiceSpawnError
  | ServiceStartupTimeout
  | ServiceStartupFailure
  | PlatformError.PlatformError,
  CommandExecutor.CommandExecutor | Scope.Scope
> =>
  Effect.gen(function* () {
    const projectRoot = findProjectRoot()
    const servicePath = `apps/${config.name}`

    // Emit 'starting' phase to TUI (if active)
    const startupState = getStartupState()
    startupState?.emitServicePhase({
      serviceName: config.name,
      displayName: config.displayName,
      phase: 'starting',
      timestamp: new Date(),
      port: config.port,
    })

    logWithPrefix(config.name, 'Starting...')

    // Load devConfig and build environment for the service
    const devConfig = yield* loadDevConfig()
    const env = buildServiceEnv(config, devConfig)

    // Use tsx watch for hot reload
    // Per RESEARCH.md: tsx watch instead of yarn dev for proper signal handling
    const command = Command.make(
      'npx',
      'tsx',
      'watch',
      '-r',
      'dotenv/config',
      'src/index.ts'
    ).pipe(
      Command.workingDirectory(`${projectRoot}/${servicePath}`),
      Command.env(env)
    )

    // Start the process
    const serviceProcess = yield* Command.start(command)

    // Fork exit monitor - fails if process exits with non-zero code during startup
    // This enables fail-fast: if service crashes, we fail immediately instead of waiting for timeout
    const exitMonitorFiber = yield* Effect.fork(
      serviceProcess.exitCode.pipe(
        Effect.flatMap((code) =>
          code !== 0
            ? Effect.fail(
                new ServiceStartupFailure({
                  serviceName: config.name,
                  exitCode: code,
                  remediation: `Check ${config.name} logs above for compilation or runtime errors`,
                })
              )
            : Effect.void
        )
      )
    )

    // Fork stdout/stderr log piping (DO NOT await - must run in background)
    // CRITICAL: Log piping is forked so race starts immediately
    yield* Effect.fork(
      pipeLogsToConsole(serviceProcess.stdout, config.name, false)
    )
    yield* Effect.fork(
      pipeLogsToConsole(serviceProcess.stderr, config.name, true)
    )

    // Race health wait vs exit monitor - fail-fast on early process exit
    yield* Effect.race(
      waitForServiceReady(config.name, config.healthPort),
      Fiber.join(exitMonitorFiber)
    )

    // Emit 'ready' phase to TUI (if active)
    startupState?.emitServicePhase({
      serviceName: config.name,
      displayName: config.displayName,
      phase: 'ready',
      timestamp: new Date(),
      port: config.port,
    })

    logSuccess(config.name, `Ready on port ${config.port}`)

    // Return process handle
    return {
      config,
      exitCode: serviceProcess.exitCode,
      kill: Effect.gen(function* () {
        logWithPrefix(config.name, 'Stopping...')
        // Send SIGTERM via the process handle's kill method
        // Effect's Command.start returns a Process with a kill method
        // Wrap in catchAll to handle "Failed to kill process" errors
        // (process may have already exited on its own)
        yield* serviceProcess.kill().pipe(Effect.catchAll(() => Effect.void))
        // Wait for exit with 5 second timeout
        yield* serviceProcess.exitCode.pipe(
          Effect.timeout('5 seconds'),
          Effect.catchAll(() => Effect.void)
        )
        logSuccess(config.name, 'Stopped')
      }).pipe(Effect.asVoid),
    } satisfies ServiceProcess
  })

/**
 * Spawn a service and handle errors gracefully.
 * Dies on error (fail-fast behavior for process-manager).
 */
export const spawnServiceSafe = (
  config: ServiceConfig
): Effect.Effect<
  ServiceProcess,
  never,
  CommandExecutor.CommandExecutor | Scope.Scope
> =>
  spawnService(config).pipe(
    Effect.catchAll((error) => {
      // Emit 'error' phase to TUI (if active)
      const startupState = getStartupState()
      const errorMessage =
        error._tag === 'ServiceStartupTimeout'
          ? `Failed to start within ${error.timeoutMs / 1000}s (health port ${error.port} not responding)`
          : error._tag === 'ServiceStartupFailure'
            ? `Process exited with code ${error.exitCode} during startup`
            : error._tag === 'ServiceSpawnError'
              ? `Failed to spawn: ${error.message}`
              : error._tag === 'DevConfigLoadError'
                ? `Failed to load devConfig.ts: ${error.message}`
                : `Failed: ${String(error)}`

      startupState?.emitServicePhase({
        serviceName: config.name,
        displayName: config.displayName,
        phase: 'error',
        timestamp: new Date(),
        port: config.port,
        errorMessage,
      })

      logError(config.name, errorMessage)
      return Effect.die(error)
    })
  )
