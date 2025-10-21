import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect'
import {NewClubUserNotificationsService} from '../../utils/NewClubUserNotificationService'

export const flushAndSendRegisteredClubNotifications = Effect.gen(
  function* (_) {
    const newClubUserNotificationService = yield* _(
      NewClubUserNotificationsService
    )
    yield* _(Effect.log('Sending registered club notifications'))
    yield* _(
      newClubUserNotificationService.flushAndSendRegisteredClubNotifications()
    )
    yield* _(Effect.log('Sending registered club notifications'))
  }
).pipe(
  withRedisLock('flushAndSendRegisteredClubNotifications'),
  Effect.withSpan('Flush and send registered club notifications'),
  Effect.catchTags({
    'RedisLockError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        message:
          'Error while processing new content notification - RedisLockError',
      }),
  })
)
