import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import dayjs from 'dayjs'
import {Effect, Either} from 'effect'
import {newContentNotificationAfterConfig} from '../../configs'
import {UserDbService} from '../../db/UserDbService'
import {issueNotificationsToTokens} from '../../utils/issueNotificationsToTokens'

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

  const {firebase, expo} = yield* _(
    issueNotificationsToTokens({
      data: {type: 'NEW_CONTENT'},
      tokens: tokensToNofify,
    })
  )

  const firebaseCount = Either.isRight(firebase)
    ? firebase.right.filter((one) => one.success).length
    : 0
  const expoCount = Either.isRight(expo)
    ? expo.right.filter((one) => one.status === 'ok').length
    : 0

  yield* _(
    Effect.log('Sent new content notification', {
      firebaseCount,
      expoCount,
      total: tokensToNofify.length,
    })
  )
}).pipe(
  withRedisLock('processNewContentNotifications', 20_000),
  Effect.tapError((e) =>
    Effect.logError('Error processing new content notification', e)
  ),
  Effect.catchTags({
    'ConfigError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        message:
          'Config error while processing new content notification. Make sure newContentNotificationAfterConfig is set in the config',
      }),
    'RedisLockError': (e) =>
      new UnexpectedServerError({
        status: 500,
        cause: e,
        message:
          'Error while acquiring / releasing redis lock for processing new content notification',
      }),
  }),
  Effect.withSpan('processNewContentNotification')
)
