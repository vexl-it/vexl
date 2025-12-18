import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {
  withRedisLock,
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Array, Effect, pipe, type ConfigError} from 'effect'
import {hashAdminId} from './hashAdminId'

export const withOfferAdminActionRedisLock =
  <A, E, R>(
    offerAdminId: OfferAdminId | OfferAdminId[]
  ): ((
    fnc: Effect.Effect<A, E, R>
  ) => Effect.Effect<
    A,
    E | UnexpectedServerError | ConfigError.ConfigError | RedisLockError,
    R | ServerCrypto | RedisService
  >) =>
  (fnc) =>
    Effect.all(
      pipe(
        Array.isArray(offerAdminId) ? offerAdminId : [offerAdminId],
        Array.map(hashAdminId)
      )
    ).pipe(
      Effect.map((hashedIds) =>
        withRedisLock<A, E, R>(
          Array.map(hashedIds, (id) => `offerAdminAction:${id}`),
          10_000
        )
      ),
      Effect.flatMap((lockFunction) => lockFunction(fnc))
    )
