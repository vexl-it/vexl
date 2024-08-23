import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import dayjs from 'dayjs'
import {Array, Effect, flow} from 'effect'
import {inactivityNotificationAfterDaysConfig} from '../../configs'
import {UserDbService} from '../../db/UserDbService'
import {sendNotificationToAllHandleNonExistingTokens} from '../../utils/notifications'

export const processUserInactivity = Effect.gen(function* (_) {
  const userDb = yield* _(UserDbService)

  const inactivityNotificationAfterDays = yield* _(
    inactivityNotificationAfterDaysConfig
  )

  const notifyBeforeDate = dayjs()
    .subtract(inactivityNotificationAfterDays, 'day')
    .toDate()

  const usersToNotify = yield* _(
    userDb.findFirebaseTokensOfInactiveUsers(notifyBeforeDate)
  )

  if (Array.isEmptyReadonlyArray(usersToNotify)) {
    yield* _(Effect.log('No inactive users to notify'))
    return
  }

  yield* _(
    Effect.log('Notifying inactive users', {count: usersToNotify.length})
  )

  const successfullySentToTokens = yield* _(
    sendNotificationToAllHandleNonExistingTokens({
      type: 'INACTIVITY_REMINDER',
      tokens: usersToNotify,
    }),
    Effect.map(
      flow(
        Array.filter((e) => e.success),
        Array.map((one) => one.token)
      )
    ),
    Effect.withSpan('Sending inactivity notification', {
      attributes: {count: usersToNotify.length},
    })
  )

  yield* _(
    Effect.log('Sent inactivity notification', {
      count: successfullySentToTokens.length,
      total: usersToNotify.length,
    })
  )

  yield* _(
    Effect.logInfo('Setting refreshed_at to null for users that were notified')
  )
  yield* _(
    Effect.forEach(
      successfullySentToTokens,
      userDb.updateSetRefreshedAtToNull,
      {batching: true}
    )
  )
}).pipe(
  withRedisLock('processUserInactivity', 10_000),
  Effect.tapError((e) =>
    Effect.logError('Error processing user inactivity', e)
  ),
  Effect.catchTags({
    'ConfigError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        detail:
          'Config error while processing user inactivity. Make sure inactivityNotificationAfterDays is set in the config',
      }),
    'RedisLockError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        detail:
          'Error while acquiring / releasing redis lock for processing user inactivity',
      }),
  }),
  Effect.withSpan('ProcessUserInactivity')
)
