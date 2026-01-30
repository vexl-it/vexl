import {Array as A, Config, Effect} from 'effect'
import {SERVICES, type ServiceConfig} from '../config/services.js'
import {isPortInUse} from '../process/readiness-checker.js'

export interface ServiceHealthStatus {
  readonly name: string
  readonly displayName: string
  readonly healthPort: number
  readonly status: 'running' | 'stopped'
  readonly mainPort: number
}

export interface InfrastructureStatus {
  readonly postgres: 'running' | 'stopped'
  readonly redis: 'running' | 'stopped'
  readonly postgresPort: number
  readonly redisPort: number
}

export interface HealthReport {
  readonly timestamp: Date
  readonly infrastructure: InfrastructureStatus
  readonly services: readonly ServiceHealthStatus[]
  readonly summary: {
    readonly total: number
    readonly running: number
    readonly stopped: number
  }
}

// Check a single service by its health port
const checkServiceHealth = (
  config: ServiceConfig
): Effect.Effect<ServiceHealthStatus> =>
  isPortInUse(config.healthPort).pipe(
    Effect.map(
      (inUse) =>
        ({
          name: config.name,
          displayName: config.displayName,
          healthPort: config.healthPort,
          status: inUse ? 'running' : 'stopped',
          mainPort: config.port,
        }) satisfies ServiceHealthStatus
    )
  )

// Port configuration with defaults matching .env.example
const infraPortsConfig = Config.all({
  postgres: Config.number('POSTGRES_PORT').pipe(Config.withDefault(5432)),
  redis: Config.number('REDIS_PORT').pipe(Config.withDefault(6379)),
})

// Default ports used when environment variables are not set
const DEFAULT_POSTGRES_PORT = 5432
const DEFAULT_REDIS_PORT = 6379

// Get configured infrastructure ports (falls back to defaults)
const getInfraPorts = (): Effect.Effect<
  {readonly postgres: number; readonly redis: number},
  never,
  never
> =>
  infraPortsConfig.pipe(
    Effect.orElseSucceed(() => ({
      postgres: DEFAULT_POSTGRES_PORT,
      redis: DEFAULT_REDIS_PORT,
    }))
  )

// Check infrastructure using configured ports from environment
export const checkInfrastructureHealth =
  (): Effect.Effect<InfrastructureStatus> =>
    Effect.gen(function* () {
      const ports = yield* getInfraPorts()
      const [postgresInUse, redisInUse] = yield* Effect.all([
        isPortInUse(ports.postgres),
        isPortInUse(ports.redis),
      ])
      return {
        postgres: postgresInUse ? 'running' : 'stopped',
        redis: redisInUse ? 'running' : 'stopped',
        postgresPort: ports.postgres,
        redisPort: ports.redis,
      } satisfies InfrastructureStatus
    })

// Check all services
export const checkAllServicesHealth = (): Effect.Effect<HealthReport> =>
  Effect.gen(function* () {
    const infrastructure = yield* checkInfrastructureHealth()
    const services = yield* Effect.all(A.map(SERVICES, checkServiceHealth), {
      concurrency: 'unbounded',
    })

    const running = A.filter(services, (s) => s.status === 'running').length
    const stopped = A.filter(services, (s) => s.status === 'stopped').length

    return {
      timestamp: new Date(),
      infrastructure,
      services,
      summary: {
        total: services.length,
        running,
        stopped,
      },
    } satisfies HealthReport
  })
