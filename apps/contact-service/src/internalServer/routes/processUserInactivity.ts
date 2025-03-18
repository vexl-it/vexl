import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import dayjs from 'dayjs'
import {Array, Effect, Either, Option} from 'effect'
import {isNotNull} from 'effect/Predicate'
import {inactivityNotificationAfterDaysConfig} from '../../configs'
import {UserDbService} from '../../db/UserDbService'
import {queryAndReportNumberOfInnactiveUsers} from '../../metrics'
import {issueNotificationsToTokens} from '../../utils/issueNotificationsToTokens'

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

  const {firebase, expo} = yield* _(
    issueNotificationsToTokens({
      data: {type: 'INACTIVITY_REMINDER'},
      tokens: usersToNotify,
    }),
    Effect.withSpan('Sending inactivity notification', {
      attributes: {count: usersToNotify.length},
    })
  )

  const firebaseCount = Either.isRight(firebase)
    ? firebase.right.filter((one) => one.success).length
    : 0
  const expoCount = Either.isRight(expo)
    ? expo.right.filter((one) => one.status === 'ok').length
    : 0

  yield* _(
    Effect.log('Sent inactivity notification', {
      firebaseCount,
      expoCount,
      total: usersToNotify.length,
    })
  )

  yield* _(
    Effect.logInfo('Setting refreshed_at to null for users that were notified')
  )
  yield* _(
    Effect.forEach(
      // TODO only those that received it
      usersToNotify
        .map(
          (one) =>
            Option.getOrNull(one.expoToken) ??
            Option.getOrNull(one.firebaseToken)
        )
        .filter(isNotNull),

      userDb.updateSetRefreshedAtToNull,
      {batching: true}
    )
  )

  yield* _(Effect.logInfo('Reporting number of inactive users'))
  yield* _(queryAndReportNumberOfInnactiveUsers)
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
