#!/usr/bin/env node
import {NodeContext, NodeRuntime} from '@effect/platform-node'
import {Command} from 'commander'
import {Cause, Deferred, Effect, Queue} from 'effect'
import type {ChildProcess} from 'node:child_process'
import type {DevConfig, MobileConfig} from './config/dev-config-schema.js'
import {
  ensureEnvLocalExists,
  findProjectRoot,
  loadEnvLocal,
} from './config/env-loader.js'
import {validateConfig} from './config/env-schema.js'
import {checkPortsAvailable, PortConflictError} from './config/port-checker.js'
import {formatStartupError, type StartupError} from './errors/index.js'
import {seedDatabases} from './infrastructure/db-seeder.js'
import {
  isInfrastructureRunning,
  startInfrastructure,
} from './infrastructure/docker.js'
import {startExpoDevServer} from './mobile/index.js'
import {clearLogBridge, createLogBridge} from './process/log-bridge.js'
import {
  type MutableRunningServices,
  restartService,
  startAllServices,
  startAllServicesMutable,
} from './process/process-manager.js'
import {createShutdownEffect} from './process/shutdown-handler.js'
import {clearStartupState, createStartupState} from './process/startup-state.js'
import {isTuiSupported, renderTui} from './tui/index.js'
import {logError, logSuccess, logWithPrefix} from './ui/logger.js'

const program = new Command()

program
  .name('dev-orchestrator')
  .description('Start Vexl development environment (Docker, services, mobile)')
  .version('1.0.0')
  .option('--no-tui', 'Disable interactive TUI, use plain console output')
  .action(async (opts: {tui: boolean}) => {
    await runOrchestrator(opts)
  })

/**
 * Track Expo process separately - it's not a backend service, doesn't have health checks.
 * Shutdown is simpler (just kill the process).
 */
let expoProcess: ChildProcess | null = null

/**
 * Load mobile configuration from devConfig.ts.
 * Returns default disabled config if not present.
 */
const loadMobileConfig = (): Effect.Effect<MobileConfig> =>
  Effect.tryPromise({
    try: async () => {
      const root = findProjectRoot()
      const module = (await import(`${root}/devConfig.ts`)) as {
        default: DevConfig
      }
      return (
        module.default.mobile ?? {
          enabled: false,
          platform: 'ios-simulator' as const,
        }
      )
    },
    catch: () => ({
      enabled: false,
      platform: 'ios-simulator' as const,
    }),
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        enabled: false,
        platform: 'ios-simulator' as const,
      })
    )
  )

/**
 * Extract database connection config for seeding from environment.
 * Uses DB_URL for host/port, DB_USER and DB_PASSWORD for credentials.
 */
const getDbSeedConfig = (): {
  host: string
  port: number
  user: string
  password: string
} => {
  const dbUrl = process.env.DB_URL ?? 'postgresql://localhost:5432/vexl-dev'
  const url = new URL(dbUrl)
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'root',
  }
}

/**
 * Main orchestrator program (plain console mode).
 * Per Phase 2 requirements:
 * 1. Validate environment (Phase 1)
 * 2. Start Docker infrastructure
 * 3. Start all services in dependency order
 * 4. Keep running until Ctrl+C
 * 5. Gracefully shutdown on exit
 */
const mainPlain = Effect.gen(function* () {
  console.log('')
  logWithPrefix('orchestrator', 'Vexl Dev Orchestrator')
  logWithPrefix('orchestrator', '='.repeat(40))
  console.log('')

  // ===== Phase 1: Environment Validation =====
  logWithPrefix('orchestrator', 'Step 1: Environment validation')

  // Ensure .env.local exists (auto-generate if needed)
  yield* ensureEnvLocalExists

  // Load environment variables
  yield* loadEnvLocal

  // Validate all required config
  const config = yield* validateConfig

  // Check if infrastructure is already running (skip infra port checks if so)
  const infraAlreadyRunning = yield* isInfrastructureRunning

  // Check port availability (skip infrastructure ports if Docker containers are running)
  yield* checkPortsAvailable(config.ports, {
    skipInfrastructure: infraAlreadyRunning,
  })

  logSuccess('orchestrator', 'Environment ready')
  console.log('')

  // ===== Phase 2: Infrastructure =====
  logWithPrefix('orchestrator', 'Step 2: Starting infrastructure')

  // startInfrastructure already handles the "already running" case
  yield* startInfrastructure

  console.log('')

  // ===== Phase 2.2: Database Seeding =====
  logWithPrefix('orchestrator', 'Step 3: Seeding databases')

  const seedConfig = getDbSeedConfig()
  yield* seedDatabases(seedConfig)

  console.log('')

  // ===== Phase 2: Services =====
  logWithPrefix('orchestrator', 'Step 4: Starting services')

  const running = yield* startAllServices

  console.log('')
  logSuccess('orchestrator', '='.repeat(40))
  logSuccess('orchestrator', 'All backend services running!')
  logSuccess('orchestrator', '='.repeat(40))
  console.log('')

  // ===== Phase 4: Mobile App =====
  const mobileConfig = yield* loadMobileConfig()

  if (mobileConfig.enabled) {
    logWithPrefix('orchestrator', 'Step 5: Starting mobile app')
    expoProcess = yield* startExpoDevServer(mobileConfig)
    logSuccess('orchestrator', 'Expo dev server running')
    logWithPrefix(
      'orchestrator',
      'EXPO_PUBLIC_LOCAL_* env vars injected for local service URLs'
    )
    console.log('')
  }

  logSuccess('orchestrator', '='.repeat(40))
  logSuccess('orchestrator', 'All systems running!')
  logSuccess('orchestrator', 'Press Ctrl+C to stop')
  logSuccess('orchestrator', '='.repeat(40))
  console.log('')

  // Register shutdown handler as finalizer
  yield* Effect.addFinalizer(() =>
    createShutdownEffect(running).pipe(
      Effect.tap(() => {
        // Shutdown Expo separately
        if (expoProcess !== null) {
          logWithPrefix('orchestrator', 'Stopping Expo dev server...')
          expoProcess.kill('SIGTERM')
          expoProcess = null
          logSuccess('orchestrator', 'Expo dev server stopped')
        }
        return Effect.void
      })
    )
  )

  // Keep running until interrupted
  yield* Effect.never
}).pipe(
  // Scope the effect for proper finalizer handling
  Effect.scoped,
  // Provide Node platform context for Command execution
  Effect.provide(NodeContext.layer)
)

/**
 * Main orchestrator program (TUI mode).
 * Key change: Renders TUI BEFORE starting services so users see the full startup sequence.
 * Per RESEARCH.md Pitfall 1: "Render TUI first, pass event subscription callbacks, then start services"
 */
const mainTui = Effect.gen(function* () {
  // ===== Phase 1: Environment Validation =====
  // (Silent startup - no console output)

  // Ensure .env.local exists (auto-generate if needed)
  yield* ensureEnvLocalExists

  // Load environment variables
  yield* loadEnvLocal

  // Validate all required config
  const config = yield* validateConfig

  // Check if infrastructure is already running (skip infra port checks if so)
  const infraAlreadyRunning = yield* isInfrastructureRunning

  // Check port availability (skip infrastructure ports if Docker containers are running)
  yield* checkPortsAvailable(config.ports, {
    skipInfrastructure: infraAlreadyRunning,
  })

  // ===== Create event bridges BEFORE rendering TUI =====
  // Per RESEARCH.md: Create startup state for event emission
  const startupState = createStartupState()
  const logBridge = createLogBridge()

  // Track running services for restart/shutdown (will be populated after startup)
  let running: MutableRunningServices = {
    processes: [],
    getByName: () => undefined,
  }

  // ===== Create restart queue to handle restarts within parent scope =====
  // This ensures spawned processes live in the long-lived mainTui scope,
  // not a short-lived scope that would kill the process immediately.
  // Each request includes a Deferred to signal completion back to the caller.
  interface RestartRequest {
    serviceName: string
    done: Deferred.Deferred<boolean, never>
  }
  const restartQueue = yield* Queue.unbounded<RestartRequest>()

  // Fork a fiber to process restart commands within the parent scope
  yield* Effect.fork(
    Effect.forever(
      Effect.gen(function* () {
        const {serviceName, done} = yield* Queue.take(restartQueue)
        yield* restartService(serviceName, running).pipe(
          Effect.catchAll((error) => {
            logError(serviceName, `Restart failed: ${formatError(error)}`)
            return Effect.void
          }),
          Effect.tap(() => Deferred.succeed(done, true))
        )
      })
    )
  )

  // ===== Render TUI immediately (services show as pending) =====
  const tui = renderTui({
    onRestart: async (serviceName) => {
      // Create a deferred to track when restart completes
      const done = Effect.runSync(Deferred.make<boolean, never>())
      // Enqueue restart command - processed by fiber in parent scope
      Effect.runSync(Queue.offer(restartQueue, {serviceName, done}))
      // Wait for the restart to complete
      await Effect.runPromise(Deferred.await(done))
    },
    onShutdown: () => {
      // Effect finalizers will handle cleanup when TUI exits
    },
    onLogSubscribe: (handler) => logBridge.onLog(handler),
    onStartupProgress: (handler) => startupState.onServiceChange(handler),
    onInfraProgress: (handler) => startupState.onInfraChange(handler),
    getAllServiceStates: () => startupState.getAllServiceStates(),
    getAllInfraStates: () => startupState.getAllInfraStates(),
  })

  // ===== Phase 2: Infrastructure (events flow to TUI) =====
  yield* startInfrastructure

  // ===== Phase 2.2: Database Seeding =====
  const seedConfig = getDbSeedConfig()
  yield* seedDatabases(seedConfig)

  // ===== Phase 2: Services (events flow to TUI) =====
  // Use mutable version for restart support
  running = yield* startAllServicesMutable

  // ===== Phase 4: Mobile App =====
  const mobileConfig = yield* loadMobileConfig()

  if (mobileConfig.enabled) {
    expoProcess = yield* startExpoDevServer(mobileConfig)
  }

  // Register shutdown handler as finalizer
  yield* Effect.addFinalizer(() =>
    createShutdownEffect(running).pipe(
      Effect.tap(() => {
        // Shutdown Expo separately
        if (expoProcess !== null) {
          expoProcess.kill('SIGTERM')
          expoProcess = null
        }
        // Clear bridges
        clearLogBridge()
        clearStartupState()
        return Effect.void
      })
    )
  )

  // Wait for TUI to exit (user pressed 'q')
  yield* Effect.promise(async () => {
    await tui.waitUntilExit()
  })
}).pipe(
  // Scope the effect for proper finalizer handling
  Effect.scoped,
  // Provide Node platform context for Command execution
  Effect.provide(NodeContext.layer)
)

/**
 * Format error for display, avoiding "[object Object]"
 */
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (typeof error === 'object' && error !== null) {
    // Handle tagged errors with message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    // Handle tagged errors with serviceName
    if ('serviceName' in error && typeof error.serviceName === 'string') {
      const tag =
        '_tag' in error && typeof error._tag === 'string'
          ? `${error._tag}: `
          : ''
      return `${tag}${error.serviceName}`
    }
    // Fallback to JSON for other objects
    try {
      return JSON.stringify(error)
    } catch {
      return '[unserializable error]'
    }
  }
  return String(error)
}

/**
 * Check if error has a specific _tag value.
 */
const isTaggedError = (error: unknown, tag: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  error._tag === tag

/**
 * Check if error is a startup error with remediation.
 */
const isStartupError = (error: unknown): error is StartupError =>
  isTaggedError(error, 'ServiceStartupFailure') ||
  isTaggedError(error, 'ServiceStartupTimeout') ||
  isTaggedError(error, 'DockerStartupError') ||
  isTaggedError(error, 'DbSeedError') ||
  isTaggedError(error, 'LanIpDetectionError') ||
  isTaggedError(error, 'ExpoStartupError')

/**
 * Handle specific error types with appropriate exit codes.
 */
const handleError = (error: unknown): number => {
  // EnvLocalNotFound - clean exit after creating .env.local
  if (isTaggedError(error, 'EnvLocalNotFound')) {
    return 0
  }

  // PortConflictError - already logged by port-checker
  if (error instanceof PortConflictError) {
    return 1
  }

  // Startup errors with remediation - use formatStartupError
  if (isStartupError(error)) {
    console.error('')
    console.error(formatStartupError(error))
    console.error('')
    return 1
  }

  // Other errors - use simple formatting
  logError('orchestrator', `Startup failed: ${formatError(error)}`)
  return 1
}

/**
 * Run the orchestrator with proper mode selection.
 */
const runOrchestrator = async (opts: {tui: boolean}): Promise<void> => {
  // Determine if TUI should be used
  const useTui = opts.tui && isTuiSupported()

  // Select main based on TUI mode
  const main = useTui ? mainTui : mainPlain

  // Run with NodeRuntime for proper signal handling
  // Per RESEARCH.md: NodeRuntime.runMain handles SIGINT/SIGTERM gracefully
  NodeRuntime.runMain(
    main.pipe(
      Effect.catchAllCause((cause) => {
        const failure = Cause.failureOption(cause)
        if (failure._tag === 'Some') {
          const exitCode = handleError(failure.value)
          return Effect.sync(() => process.exit(exitCode))
        }
        // Defects or interrupts
        return Effect.sync(() => process.exit(1))
      })
    )
  )
}

program.parse()
