import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect/index'

export const lockOnNotificationToken =
  (token: VexlNotificationTokenSecret) =>
  <A, E, R>(a: Effect.Effect<A, E, R>) =>
    RedisService.pipe(
      Effect.flatMap((redis) =>
        redis.withLock(a)(`notification-token-lock:${token}`)
      )
    )
