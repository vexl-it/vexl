import {CheckUserExistsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
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
    type: 'LOGGING_ON_DIFFERENT_DEVICE',
    tokens: [token],
  }).pipe(
    Effect.withSpan('Send notification about logging on different device'),
    Effect.forkDaemon,
    Effect.ignore
  )

export const checkUserExists = Handler.make(
  CheckUserExistsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const userDb = yield* _(UserDbService)
        const existingUser = yield* _(userDb.findUserByHash(security.hash))

        if (
          req.query.notifyExistingUserAboutLogin &&
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
              notifyParam: req.query.notifyExistingUserAboutLogin,
              existingUserExists: Option.isSome(existingUser),
              existingUserHasToken:
                Option.isSome(existingUser) &&
                Option.isSome(existingUser.value.firebaseToken),
            })
          )
        }

        return {exists: Option.isSome(existingUser)}
      }),
      Schema.Void
    )
)
