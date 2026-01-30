import {detect} from 'detect-port'
import {Array as A, Console, Effect} from 'effect'

interface PortRequirement {
  readonly name: string
  readonly port: number
  readonly envVar: string
  readonly isInfrastructure?: boolean
}

export class PortConflictError {
  readonly _tag = 'PortConflictError'
  constructor(readonly conflicts: readonly string[]) {}
}

/**
 * Checks if all required ports are available.
 * Returns success if all ports are free, fails with PortConflictError listing all conflicts.
 * @param skipInfrastructure - If true, skip checking Postgres/Redis ports (useful when Docker is already running)
 */
export const checkPortsAvailable = (
  ports: {
    readonly postgres: number
    readonly redis: number
    readonly userService: number
    readonly contactService: number
    readonly offerService: number
    readonly chatService: number
    readonly locationService: number
    readonly notificationService: number
    readonly btcExchangeRateService: number
    readonly feedbackService: number
    readonly contentService: number
    readonly metricsService: number
  },
  options?: {skipInfrastructure?: boolean}
): Effect.Effect<{readonly success: true}, PortConflictError, never> =>
  Effect.gen(function* () {
    const allRequirements: readonly PortRequirement[] = [
      {
        name: 'PostgreSQL',
        port: ports.postgres,
        envVar: 'POSTGRES_PORT',
        isInfrastructure: true,
      },
      {
        name: 'Redis',
        port: ports.redis,
        envVar: 'REDIS_PORT',
        isInfrastructure: true,
      },
      {
        name: 'User Service',
        port: ports.userService,
        envVar: 'USER_SERVICE_PORT',
      },
      {
        name: 'Contact Service',
        port: ports.contactService,
        envVar: 'CONTACT_SERVICE_PORT',
      },
      {
        name: 'Offer Service',
        port: ports.offerService,
        envVar: 'OFFER_SERVICE_PORT',
      },
      {
        name: 'Chat Service',
        port: ports.chatService,
        envVar: 'CHAT_SERVICE_PORT',
      },
      {
        name: 'Location Service',
        port: ports.locationService,
        envVar: 'LOCATION_SERVICE_PORT',
      },
      {
        name: 'Notification Service',
        port: ports.notificationService,
        envVar: 'NOTIFICATION_SERVICE_PORT',
      },
      {
        name: 'BTC Exchange Rate Service',
        port: ports.btcExchangeRateService,
        envVar: 'BTC_EXCHANGE_RATE_SERVICE_PORT',
      },
      {
        name: 'Feedback Service',
        port: ports.feedbackService,
        envVar: 'FEEDBACK_SERVICE_PORT',
      },
      {
        name: 'Content Service',
        port: ports.contentService,
        envVar: 'CONTENT_SERVICE_PORT',
      },
      {
        name: 'Metrics Service',
        port: ports.metricsService,
        envVar: 'METRICS_SERVICE_PORT',
      },
    ]

    yield* Console.log('Checking port availability...')

    // Filter out infrastructure ports if skipInfrastructure is set
    const requirements = options?.skipInfrastructure
      ? A.filter(allRequirements, (req) => !req.isInfrastructure)
      : allRequirements

    const conflicts: string[] = []

    for (const req of requirements) {
      const available = yield* Effect.promise(
        async () => await detect(req.port)
      )
      if (available !== req.port) {
        conflicts.push(
          `${req.name}: Port ${req.port} is in use. ` +
            `Either stop the process using this port or set ${req.envVar} in .env.local`
        )
      }
    }

    if (A.isNonEmptyArray(conflicts)) {
      yield* Console.error('')
      yield* Console.error('Port conflicts detected:')
      for (const conflict of conflicts) {
        yield* Console.error(`  - ${conflict}`)
      }
      yield* Console.error('')
      return yield* Effect.fail(new PortConflictError(conflicts))
    }

    yield* Console.log('All ports are available')
    return {success: true as const}
  })
