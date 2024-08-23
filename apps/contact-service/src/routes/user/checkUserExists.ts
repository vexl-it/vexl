import {Schema} from '@effect/schema'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {CheckUserExistsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'
import {sendNotificationToAllHandleNonExistingTokens} from '../../utils/notifications'
import {type FirebaseMessagingService} from '../../utils/notifications/FirebaseMessagingService'

const sendNotificationToExistingUserFork = (
  fcmToken: FcmToken
): Effect.Effect<void, never, UserDbService | FirebaseMessagingService> =>
  sendNotificationToAllHandleNonExistingTokens({
    type: 'LOGGING_ON_DIFFERENT_DEVICE',
    tokens: [fcmToken],
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
          Option.isSome(existingUser.value.firebaseToken)
        ) {
          yield* _(Effect.logInfo('Sending notification to existing user'))
          yield* _(
            sendNotificationToExistingUserFork(
              existingUser.value.firebaseToken.value
            )
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
