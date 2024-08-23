import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import dayjs from 'dayjs'
import {Array, Effect, flow} from 'effect'
import {newContentNotificationAfterConfig} from '../../configs'
import {UserDbService} from '../../db/UserDbService'
import {sendNotificationToAllHandleNonExistingTokens} from '../../utils/notifications'

export const processNewContentNotifications = Effect.gen(function* (_) {
  const userDb = yield* _(UserDbService)
  const notifyBeforeDate = dayjs()
    .subtract(yield* _(newContentNotificationAfterConfig), 'day')
    .toDate()

  const tokensToNofify = yield* _(
    userDb.findFirebaseTokensForNewContentNotification(notifyBeforeDate)
  )

  yield* _(
    Effect.log('Notifying users of new content', {count: tokensToNofify.length})
  )

  const sentToTokens = yield* _(
    sendNotificationToAllHandleNonExistingTokens({
      type: 'NEW_CONTENT',
      tokens: tokensToNofify,
    }),
    Effect.map(
      flow(
        Array.filter((one) => one.success),
        Array.map((one) => one.token)
      )
    )
  )

  yield* _(
    Effect.log('Sent new content notification', {
      count: sentToTokens.length,
      total: tokensToNofify.length,
    })
  )
}).pipe(
  withRedisLock('processNewContentNotifications', 10_000),
  Effect.tapError((e) =>
    Effect.logError('Error processing new content notification', e)
  ),
  Effect.catchTags({
    'ConfigError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        detail:
          'Config error while processing new content notification. Make sure newContentNotificationAfterConfig is set in the config',
      }),
    'RedisLockError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        detail:
          'Error while acquiring / releasing redis lock for processing new content notification',
      }),
  }),
  Effect.withSpan('processNewContentNotification')
)
