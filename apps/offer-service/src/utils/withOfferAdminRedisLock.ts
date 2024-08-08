import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {
  type RedisLockError,
  type RedisService,
  withRedisLock,
} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Array, type ConfigError, Effect, pipe} from 'effect'
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
        Array.map((a) => hashAdminId(a))
      )
    ).pipe(
      Effect.map((hashedIds) =>
        withRedisLock<A, E, R>(
          Array.map(hashedIds, (id) => `offerAdminAction:${id}`),
          5000
        )
      ),
      Effect.flatMap((lockFunction) => lockFunction(fnc))
    )
