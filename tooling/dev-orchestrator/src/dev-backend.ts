#!/usr/bin/env node
import {NodeContext, NodeRuntime} from '@effect/platform-node'
import {Command} from 'commander'
import {Cause, Deferred, Effect, Queue} from 'effect'
import {ensureEnvLocalExists, loadEnvLocal} from './config/env-loader.js'
import {validateConfig} from './config/env-schema.js'
import {checkPortsAvailable, PortConflictError} from './config/port-checker.js'
import {formatStartupError, type StartupError} from './errors/index.js'
import {seedDatabases} from './infrastructure/db-seeder.js'
import {
  isInfrastructureRunning,
  startInfrastructure,
} from './infrastructure/docker.js'
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
  .name('dev-backend')
  .description('Start Docker infrastructure and all backend services')
  .version('1.0.0')
  .option('--no-tui', 'Disable interactive TUI, use plain console output')
  .action(async (opts: {tui: boolean}) => {
    await runBackendOrchestrator(opts)
  })

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
 * Backend-only orchestrator program (plain console mode).
 * Runs Steps 1-4 from the full orchestrator:
 * 1. Validate environment (Phase 1)
 * 2. Start Docker infrastructure
 * 3. Seed databases
 * 4. Start all backend services
 * 5. Keep running until Ctrl+C
 * 6. Gracefully shutdown on exit
 *
 * Does NOT include Expo/mobile app startup.
 */
const mainPlain = Effect.gen(function* () {
  console.log('')
  logWithPrefix('orchestrator', 'Vexl Dev Backend Orchestrator')
  logWithPrefix('orchestrator', '='.repeat(40))
  console.log('')

  // ===== Step 1: Environment Validation =====
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

  // ===== Step 2: Infrastructure =====
  logWithPrefix('orchestrator', 'Step 2: Starting infrastructure')

  // startInfrastructure already handles the "already running" case
  yield* startInfrastructure

  console.log('')

  // ===== Step 3: Database Seeding =====
  logWithPrefix('orchestrator', 'Step 3: Seeding databases')

  const seedConfig = getDbSeedConfig()
  yield* seedDatabases(seedConfig)

  console.log('')

  // ===== Step 4: Services =====
  logWithPrefix('orchestrator', 'Step 4: Starting services')

  const running = yield* startAllServices

  console.log('')
  logSuccess('orchestrator', '='.repeat(40))
  logSuccess('orchestrator', 'All backend services running!')
  logSuccess('orchestrator', 'Press Ctrl+C to stop')
  logSuccess('orchestrator', '='.repeat(40))
  console.log('')

  // Register shutdown handler as finalizer
  yield* Effect.addFinalizer(() => createShutdownEffect(running))

  // Keep running until interrupted
  yield* Effect.never
}).pipe(
  // Scope the effect for proper finalizer handling
  Effect.scoped,
  // Provide Node platform context for Command execution
  Effect.provide(NodeContext.layer)
)

/**
 * Backend-only orchestrator program (TUI mode).
 * Key change: Renders TUI BEFORE starting services so users see the full startup sequence.
 * Per RESEARCH.md Pitfall 1: "Render TUI first, pass event subscription callbacks, then start services"
 */
const mainTui = Effect.gen(function* () {
  // ===== Step 1: Environment Validation =====
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

  // ===== Step 2: Infrastructure (events flow to TUI) =====
  yield* startInfrastructure

  // ===== Step 3: Database Seeding =====
  const seedConfig = getDbSeedConfig()
  yield* seedDatabases(seedConfig)

  // ===== Step 4: Services (events flow to TUI) =====
  // Use mutable version for restart support
  running = yield* startAllServicesMutable

  // Register shutdown handler as finalizer
  yield* Effect.addFinalizer(() =>
    createShutdownEffect(running).pipe(
      Effect.tap(() => {
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
  isTaggedError(error, 'LanIpDetectionError')

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
 * Run the backend orchestrator with proper mode selection.
 */
const runBackendOrchestrator = async (opts: {tui: boolean}): Promise<void> => {
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
