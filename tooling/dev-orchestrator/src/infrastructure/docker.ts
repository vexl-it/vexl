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
  Health?: string
}

interface RequiredInfraContainer {
  readonly containerName: string
  readonly requiresHealthyState: boolean
}

const requiredInfraContainers: readonly RequiredInfraContainer[] = [
  {
    containerName: 'vexl-postgres',
    requiresHealthyState: true,
  },
  {
    containerName: 'vexl-redis',
    requiresHealthyState: true,
  },
  {
    containerName: 'vexl-loki',
    requiresHealthyState: false,
  },
  {
    containerName: 'vexl-alloy',
    requiresHealthyState: false,
  },
  {
    containerName: 'vexl-grafana',
    requiresHealthyState: false,
  },
  {
    containerName: 'vexl-tempo',
    requiresHealthyState: false,
  },
]

const getGrafanaUrl = (): string =>
  `http://localhost:${process.env.GRAFANA_PORT ?? '3030'}`

const getTempoUrl = (): string =>
  `http://localhost:${process.env.TEMPO_PORT ?? '3200'}`

const infrastructureContainerNames = EffectArray.map(
  requiredInfraContainers,
  (container) => container.containerName
)

const parseContainerStatusOutput = (
  stdout: string
): ContainerStatus[] | null => {
  if (!stdout.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(stdout.trim())
    if (Array.isArray(parsed)) {
      return parsed as ContainerStatus[]
    }
    return [parsed as ContainerStatus]
  } catch {
    const lines = pipe(
      stdout.trim().split('\n'),
      EffectArray.filter((line) => line.trim().length > 0)
    )

    if (!EffectArray.isNonEmptyArray(lines)) {
      return null
    }

    return pipe(
      lines,
      EffectArray.filterMap((line) => {
        try {
          return Option.some(JSON.parse(line) as ContainerStatus)
        } catch {
          return Option.none()
        }
      })
    )
  }
}

const getExistingInfrastructureContainerNames = Effect.gen(function* () {
  const command = Command.make('docker', 'ps', '-a', '--format', '{{.Names}}')

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
    return [] as string[]
  }

  const stdout = Chunk.toArray(stdoutChunks).join('')
  return pipe(
    stdout.split('\n'),
    EffectArray.filter((line) => line.trim().length > 0),
    EffectArray.filter((containerName) =>
      infrastructureContainerNames.includes(containerName)
    )
  )
})

export const hasExistingInfrastructureContainers = Effect.gen(function* () {
  const existingContainers = yield* getExistingInfrastructureContainerNames
  return existingContainers.length > 0
})

const removeExistingInfrastructureContainers = (
  containerNames: string[]
): Effect.Effect<void, never, never> => {
  if (containerNames.length === 0) {
    return Effect.void
  }

  return pipe(
    Command.make('docker', 'rm', '-f', ...containerNames),
    Command.start,
    Effect.flatMap((process) => process.exitCode),
    Effect.scoped,
    Effect.provide(NodeContext.layer),
    Effect.catchAll(() => Effect.void),
    Effect.asVoid
  )
}

/**
 * Check if Docker infrastructure is already running.
 * Postgres and Redis must be healthy; observability containers must be running.
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

  const containers = parseContainerStatusOutput(stdout)

  if (containers === null || containers.length === 0) {
    return false
  }

  return pipe(
    requiredInfraContainers,
    EffectArray.every((requiredContainer) => {
      const runningContainer = pipe(
        containers,
        EffectArray.findFirst(
          (container) => container.Name === requiredContainer.containerName
        )
      )

      if (runningContainer._tag !== 'Some') {
        return false
      }

      if (runningContainer.value.State !== 'running') {
        return false
      }

      if (!requiredContainer.requiresHealthyState) {
        return true
      }

      return runningContainer.value.Health === 'healthy'
    })
  )
})

/**
 * Start Docker infrastructure using docker compose.
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
    startupState?.emitInfraPhase({
      name: 'grafana',
      phase: 'ready',
      timestamp: readyTime,
    })
    startupState?.emitInfraPhase({
      name: 'tempo',
      phase: 'ready',
      timestamp: readyTime,
    })

    logSuccess(
      'docker',
      `Infrastructure already running (Postgres, Redis, Grafana at ${getGrafanaUrl()}, Tempo at ${getTempoUrl()})`
    )
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
  startupState?.emitInfraPhase({
    name: 'grafana',
    phase: 'starting',
    timestamp: now,
  })
  startupState?.emitInfraPhase({
    name: 'tempo',
    phase: 'starting',
    timestamp: now,
  })

  logWithPrefix('docker', 'Starting infrastructure...')

  const existingContainers = yield* getExistingInfrastructureContainerNames

  if (existingContainers.length > 0) {
    logWithPrefix(
      'docker',
      `Removing stale infrastructure containers: ${existingContainers.join(', ')}`
    )
    yield* removeExistingInfrastructureContainers(existingContainers)
  }

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
  startupState?.emitInfraPhase({
    name: 'grafana',
    phase: 'ready',
    timestamp: readyTime,
  })
  startupState?.emitInfraPhase({
    name: 'tempo',
    phase: 'ready',
    timestamp: readyTime,
  })

  logSuccess(
    'docker',
    `Infrastructure ready (Postgres, Redis, Grafana at ${getGrafanaUrl()}, Tempo at ${getTempoUrl()})`
  )
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
