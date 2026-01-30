import type {CommandExecutor, Error as PlatformError} from '@effect/platform'
import {NodeContext} from '@effect/platform-node'
import type {Scope} from 'effect'
import {Array as A, Effect, Option} from 'effect'
import type {ServiceConfig} from '../config/services.js'
import {getServicesByTier, SERVICES} from '../config/services.js'
import type {
  ServiceStartupFailure,
  ServiceStartupTimeout,
} from '../errors/index.js'
import {logSuccess, logWithPrefix} from '../ui/logger.js'
import type {
  DevConfigLoadError,
  ServiceProcess,
  ServiceSpawnError,
} from './service-runner.js'
import {spawnService} from './service-runner.js'

/**
 * Union of all possible startup errors
 */
export type StartupError =
  | DevConfigLoadError
  | ServiceSpawnError
  | ServiceStartupTimeout
  | ServiceStartupFailure
  | PlatformError.PlatformError

/**
 * Collection of running service processes.
 */
export interface RunningServices {
  readonly processes: readonly ServiceProcess[]
  readonly getByName: (name: string) => ServiceProcess | undefined
}

/**
 * Start all services in dependency order.
 * Per CONTEXT.md:
 * - Services in same tier start in parallel
 * - Fail fast if any service fails to start
 * - Subset mode via flags (not implemented yet)
 *
 * @returns RunningServices handle for all started processes
 */
export const startAllServices: Effect.Effect<
  RunningServices,
  StartupError,
  CommandExecutor.CommandExecutor | Scope.Scope
> = Effect.gen(function* () {
  const tiers = getServicesByTier()
  const allProcesses: ServiceProcess[] = []

  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
    const tierServices = tiers[tierIndex]
    if (tierServices === undefined || tierServices.length === 0) continue

    logWithPrefix('orchestrator', `Starting tier ${tierIndex} services...`)

    // Start all services in this tier in parallel
    const tierProcesses = yield* Effect.all(
      A.map(tierServices, (config) => spawnService(config)),
      {concurrency: 'unbounded'}
    )

    allProcesses.push(...tierProcesses)

    logSuccess(
      'orchestrator',
      `Tier ${tierIndex} ready (${tierServices.length} services)`
    )
  }

  logSuccess('orchestrator', `All ${allProcesses.length} services running`)

  return {
    processes: allProcesses,
    getByName: (name: string) => {
      const found = A.findFirst(allProcesses, (p) => p.config.name === name)
      return Option.isSome(found) ? found.value : undefined
    },
  } satisfies RunningServices
}).pipe(Effect.provide(NodeContext.layer))

/**
 * Start a subset of services by name.
 * Per CONTEXT.md: --only user-service,chat-service flag support.
 */
export const startServicesByName = (
  serviceNames: readonly string[]
): Effect.Effect<
  RunningServices,
  StartupError,
  CommandExecutor.CommandExecutor | Scope.Scope
> =>
  Effect.gen(function* () {
    // Filter to requested services, maintaining tier order
    const tiers = getServicesByTier()
    const allProcesses: ServiceProcess[] = []

    for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
      const tierServices = A.filter(
        tiers[tierIndex] ?? [],
        (s: ServiceConfig) => serviceNames.includes(s.name)
      )
      if (tierServices.length === 0) continue

      logWithPrefix('orchestrator', `Starting tier ${tierIndex} services...`)

      const tierProcesses = yield* Effect.all(
        A.map(tierServices, (config) => spawnService(config)),
        {concurrency: 'unbounded'}
      )

      allProcesses.push(...tierProcesses)

      logSuccess('orchestrator', `Tier ${tierIndex} ready`)
    }

    return {
      processes: allProcesses,
      getByName: (name: string) => {
        const found = A.findFirst(allProcesses, (p) => p.config.name === name)
        return Option.isSome(found) ? found.value : undefined
      },
    } satisfies RunningServices
  })

/**
 * Stop all running services.
 * Per CONTEXT.md: 5 second graceful timeout, SIGTERM to all simultaneously.
 */
export const stopAllServices = (
  running: RunningServices
): Effect.Effect<void, PlatformError.PlatformError> =>
  Effect.gen(function* () {
    if (running.processes.length === 0) return

    logWithPrefix('orchestrator', 'Stopping all services...')

    // Kill all processes in parallel
    yield* Effect.all(
      A.map(running.processes, (p) => p.kill),
      {concurrency: 'unbounded'}
    )

    logSuccess('orchestrator', 'All services stopped')
  })

/**
 * Mutable running services interface for restart support.
 * This allows updating the process list when a service is restarted.
 */
export interface MutableRunningServices {
  processes: ServiceProcess[]
  readonly getByName: (name: string) => ServiceProcess | undefined
}

/**
 * Start all services and return mutable handle for restart support.
 */
export const startAllServicesMutable: Effect.Effect<
  MutableRunningServices,
  StartupError,
  CommandExecutor.CommandExecutor | Scope.Scope
> = Effect.gen(function* () {
  const tiers = getServicesByTier()
  const allProcesses: ServiceProcess[] = []

  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
    const tierServices = tiers[tierIndex]
    if (tierServices === undefined || tierServices.length === 0) continue

    logWithPrefix('orchestrator', `Starting tier ${tierIndex} services...`)

    // Start all services in this tier in parallel
    const tierProcesses = yield* Effect.all(
      A.map(tierServices, (config) => spawnService(config)),
      {concurrency: 'unbounded'}
    )

    allProcesses.push(...tierProcesses)

    logSuccess(
      'orchestrator',
      `Tier ${tierIndex} ready (${tierServices.length} services)`
    )
  }

  logSuccess('orchestrator', `All ${allProcesses.length} services running`)

  return {
    processes: allProcesses,
    getByName: (name: string) => {
      const found = A.findFirst(allProcesses, (p) => p.config.name === name)
      return Option.isSome(found) ? found.value : undefined
    },
  } satisfies MutableRunningServices
}).pipe(Effect.provide(NodeContext.layer))

/**
 * Restart a single service by name.
 * Kills the existing process and spawns a new one.
 */
export const restartService = (
  serviceName: string,
  running: MutableRunningServices
): Effect.Effect<
  void,
  StartupError,
  CommandExecutor.CommandExecutor | Scope.Scope
> =>
  Effect.gen(function* () {
    const existing = running.getByName(serviceName)
    if (existing === undefined) {
      logWithPrefix('orchestrator', `Service ${serviceName} not found`)
      return
    }

    logWithPrefix(serviceName, 'Restarting...')

    // Kill existing process
    yield* existing.kill

    // Wait a moment for port to free up
    yield* Effect.sleep('1 second')

    // Find service config and restart
    const serviceConfig = A.findFirst(SERVICES, (s) => s.name === serviceName)
    if (Option.isSome(serviceConfig)) {
      const newProcess = yield* spawnService(serviceConfig.value)
      // Update running services array
      const index = A.findFirstIndex(
        running.processes,
        (p) => p.config.name === serviceName
      )
      if (Option.isSome(index)) {
        running.processes[index.value] = newProcess
      }
      logSuccess(serviceName, 'Restarted')
    }
  }).pipe(Effect.provide(NodeContext.layer))
