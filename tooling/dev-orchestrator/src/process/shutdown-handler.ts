import {NodeContext} from '@effect/platform-node'
import {Effect} from 'effect'
import {stopInfrastructure} from '../infrastructure/docker.js'
import {logSuccess, logWithPrefix} from '../ui/logger.js'
import type {RunningServices} from './process-manager.js'
import {stopAllServices} from './process-manager.js'

/**
 * Shutdown handler that cleans up services and infrastructure.
 * Per CONTEXT.md:
 * - 5 second graceful timeout before force-kill (handled in service-runner)
 * - Docker containers stop, volumes persist
 * - All services receive SIGTERM simultaneously
 * - Visual progress during shutdown
 */
export const createShutdownEffect = (
  running: RunningServices
): Effect.Effect<void> =>
  Effect.gen(function* () {
    logWithPrefix('orchestrator', '')
    logWithPrefix('orchestrator', 'Shutting down...')

    // Stop all services first (5 second timeout per service)
    yield* stopAllServices(running)

    // Then stop Docker infrastructure (volumes persist)
    yield* stopInfrastructure

    logSuccess('orchestrator', 'Shutdown complete')
  }).pipe(
    // Ensure shutdown completes even if there are errors
    Effect.catchAll((error) => {
      logWithPrefix('orchestrator', `Shutdown error: ${String(error)}`)
      return Effect.void
    }),
    // Provide NodeContext and scope for Command execution
    Effect.scoped,
    Effect.provide(NodeContext.layer)
  )
