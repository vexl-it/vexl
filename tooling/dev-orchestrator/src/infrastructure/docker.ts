import {Command} from '@effect/platform'
import {NodeContext} from '@effect/platform-node'
import {Chunk, Effect, Array as EffectArray, Option, pipe, Stream} from 'effect'
import {findProjectRoot} from '../config/env-loader.js'
import {getStartupState} from '../process/startup-state.js'
import {logError, logSuccess, logWithPrefix} from '../ui/logger.js'

export class DockerStartupError {
  readonly _tag = 'DockerStartupError'
  constructor(
    readonly message: string,
    readonly exitCode: number
  ) {}
}

interface ContainerStatus {
  Name: string
  State: string
  Health: string
}

/**
 * Check if Docker infrastructure (Postgres, Redis) is already running and healthy.
 * Returns true if both containers exist and are running with healthy status.
 */
export const isInfrastructureRunning = Effect.gen(function* () {
  const projectRoot = findProjectRoot()
  const composeFile = `${projectRoot}/dev.docker-compose.yaml`

  const command = pipe(
    Command.make(
      'docker',
      'compose',
      '-f',
      composeFile,
      'ps',
      '--format',
      'json'
    ),
    Command.workingDirectory(projectRoot)
  )

  const result = yield* pipe(
    Command.start(command),
    Effect.flatMap((process) =>
      Effect.all(
        [
          process.exitCode,
          pipe(process.stdout, Stream.decodeText(), Stream.runCollect),
        ],
        {concurrency: 2}
      )
    ),
    Effect.scoped,
    Effect.provide(NodeContext.layer),
    Effect.catchAll(() => Effect.succeed([1, Chunk.empty<string>()] as const))
  )

  const [exitCode, stdoutChunks] = result
  if (exitCode !== 0) {
    return false
  }

  const stdout = Chunk.toArray(stdoutChunks).join('')
  if (!stdout.trim()) {
    return false
  }

  // docker compose ps --format json outputs a JSON array of container objects
  let containers: ContainerStatus[]
  try {
    const parsed = JSON.parse(stdout.trim())
    // Handle both array format and line-delimited format
    if (Array.isArray(parsed)) {
      containers = parsed as ContainerStatus[]
    } else {
      // Single object case (shouldn't happen with current docker compose)
      containers = [parsed as ContainerStatus]
    }
  } catch {
    // Try parsing as line-delimited JSON (older docker compose versions)
    const lines = pipe(
      stdout.trim().split('\n'),
      EffectArray.filter((line) => line.trim().length > 0)
    )

    if (!EffectArray.isNonEmptyArray(lines)) {
      return false
    }

    containers = pipe(
      lines,
      EffectArray.filterMap((line) => {
        try {
          const parsed = JSON.parse(line) as ContainerStatus
          return Option.some(parsed)
        } catch {
          return Option.none()
        }
      })
    )
  }

  if (!EffectArray.isNonEmptyArray(containers)) {
    return false
  }

  // Check for vexl-postgres and vexl-redis
  const postgresContainer = pipe(
    containers,
    EffectArray.findFirst((c) => c.Name === 'vexl-postgres')
  )
  const redisContainer = pipe(
    containers,
    EffectArray.findFirst((c) => c.Name === 'vexl-redis')
  )

  // Both must exist, be running, and be healthy
  const isPostgresHealthy =
    postgresContainer._tag === 'Some' &&
    postgresContainer.value.State === 'running' &&
    postgresContainer.value.Health === 'healthy'

  const isRedisHealthy =
    redisContainer._tag === 'Some' &&
    redisContainer.value.State === 'running' &&
    redisContainer.value.Health === 'healthy'

  return isPostgresHealthy && isRedisHealthy
})

/**
 * Start Docker infrastructure (Postgres, Redis) using docker compose.
 * Checks if containers are already running first.
 * Waits for containers to be healthy before returning.
 * Per CONTEXT.md: volumes persist, containers stop on exit.
 */
export const startInfrastructure = Effect.gen(function* () {
  const projectRoot = findProjectRoot()
  const composeFile = `${projectRoot}/dev.docker-compose.yaml`
  const startupState = getStartupState()

  // Check if infrastructure is already running
  const alreadyRunning = yield* isInfrastructureRunning

  if (alreadyRunning) {
    // Emit 'ready' phase events immediately
    const readyTime = new Date()
    startupState?.emitInfraPhase({
      name: 'docker',
      phase: 'ready',
      timestamp: readyTime,
    })
    startupState?.emitInfraPhase({
      name: 'postgres',
      phase: 'ready',
      timestamp: readyTime,
    })
    startupState?.emitInfraPhase({
      name: 'redis',
      phase: 'ready',
      timestamp: readyTime,
    })

    logSuccess('docker', 'Infrastructure already running (Postgres, Redis)')
    return {success: true as const}
  }

  // Emit 'starting' phase for infrastructure (if TUI active)
  const now = new Date()
  startupState?.emitInfraPhase({
    name: 'docker',
    phase: 'starting',
    timestamp: now,
  })
  startupState?.emitInfraPhase({
    name: 'postgres',
    phase: 'starting',
    timestamp: now,
  })
  startupState?.emitInfraPhase({
    name: 'redis',
    phase: 'starting',
    timestamp: now,
  })

  logWithPrefix('docker', 'Starting infrastructure...')

  // Run docker compose up -d --wait (waits for health checks)
  const command = pipe(
    Command.make('docker', 'compose', '-f', composeFile, 'up', '-d', '--wait'),
    Command.workingDirectory(projectRoot)
  )

  const result = yield* pipe(
    Command.start(command),
    Effect.flatMap((process) =>
      Effect.all(
        [
          process.exitCode,
          // Capture stdout for logging
          pipe(process.stdout, Stream.decodeText(), Stream.runCollect),
          // Capture stderr for error messages
          pipe(process.stderr, Stream.decodeText(), Stream.runCollect),
        ],
        {concurrency: 3}
      )
    ),
    Effect.provide(NodeContext.layer)
  )

  const [exitCode, stdoutChunks, stderrChunks] = result
  const stdout = Chunk.toArray(stdoutChunks).join('')
  const stderr = Chunk.toArray(stderrChunks).join('')

  if (exitCode !== 0) {
    if (stderr.trim()) {
      logError('docker', stderr.trim())
    }
    return yield* Effect.fail(
      new DockerStartupError(
        `Docker compose failed with exit code ${exitCode}`,
        exitCode
      )
    )
  }

  // Log any output
  if (stdout.trim()) {
    logWithPrefix('docker', stdout.trim())
  }

  // Emit 'ready' phase for infrastructure (if TUI active)
  const readyTime = new Date()
  startupState?.emitInfraPhase({
    name: 'docker',
    phase: 'ready',
    timestamp: readyTime,
  })
  startupState?.emitInfraPhase({
    name: 'postgres',
    phase: 'ready',
    timestamp: readyTime,
  })
  startupState?.emitInfraPhase({
    name: 'redis',
    phase: 'ready',
    timestamp: readyTime,
  })

  logSuccess('docker', 'Infrastructure ready (Postgres, Redis)')
  return {success: true as const}
})

/**
 * Stop Docker infrastructure.
 * Per CONTEXT.md: volumes persist (no -v flag).
 */
export const stopInfrastructure = Effect.gen(function* () {
  const projectRoot = findProjectRoot()
  const composeFile = `${projectRoot}/dev.docker-compose.yaml`

  logWithPrefix('docker', 'Stopping infrastructure...')

  const command = pipe(
    Command.make('docker', 'compose', '-f', composeFile, 'stop'),
    Command.workingDirectory(projectRoot)
  )

  const exitCode = yield* pipe(
    Command.start(command),
    Effect.flatMap((process) => process.exitCode),
    Effect.provide(NodeContext.layer)
  )

  if (exitCode !== 0) {
    logError('docker', `Docker compose stop failed with exit code ${exitCode}`)
  } else {
    logSuccess('docker', 'Infrastructure stopped')
  }

  return {success: exitCode === 0}
})
