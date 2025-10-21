import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {type NotificationTokens} from '../../db/UserDbService/domain'
import {type ExpoNotificationsService} from '../../utils/expoNotifications/ExpoNotificationsService'
import {issueNotificationsToTokens} from '../../utils/issueNotificationsToTokens'
import {type FirebaseMessagingService} from '../../utils/notifications/FirebaseMessagingService'

const sendNotificationToExistingUserFork = (
  token: NotificationTokens
): Effect.Effect<
  void,
  never,
  UserDbService | FirebaseMessagingService | ExpoNotificationsService
> =>
  issueNotificationsToTokens({
    data: {type: 'LOGGING_ON_DIFFERENT_DEVICE'},
    tokens: [token],
  }).pipe(
    Effect.withSpan('Send notification about logging on different device'),
    Effect.forkDaemon,
    Effect.ignore
  )

export const checkUserExists = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'checkUserExists',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const userDb = yield* _(UserDbService)
      const existingUser = yield* _(userDb.findUserByHash(security.hash))

      if (
        req.urlParams.notifyExistingUserAboutLogin &&
        Option.isSome(existingUser) &&
        (Option.isSome(existingUser.value.firebaseToken) ||
          Option.isSome(existingUser.value.expoToken))
      ) {
        yield* _(Effect.logInfo('Sending notification to existing user'))
        yield* _(
          sendNotificationToExistingUserFork({
            expoToken: existingUser.value.expoToken,
            firebaseToken: existingUser.value.firebaseToken,
          })
        )
      } else {
        yield* _(
          Effect.logInfo('Not sending notification to existing user', {
            notifyParam: req.urlParams.notifyExistingUserAboutLogin,
            existingUserExists: Option.isSome(existingUser),
            existingUserHasToken:
              Option.isSome(existingUser) &&
              Option.isSome(existingUser.value.firebaseToken),
          })
        )
      }

      return {exists: Option.isSome(existingUser)}
    }).pipe(makeEndpointEffect)
)
