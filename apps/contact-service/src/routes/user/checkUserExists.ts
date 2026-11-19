import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {UserNotificationService} from '../../services/UserNotificationService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const checkUserExists = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'checkUserExists',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const userDb = yield* _(UserDbService)
      const userNotificationService = yield* _(UserNotificationService)
      const existingUser = yield* _(userDb.findUserByHash(security.serverHash))

      if (
        req.urlParams.notifyExistingUserAboutLogin &&
        Option.isSome(existingUser) &&
        // Not the caller's own account, as when adding a number is retried
        existingUser.value.publicKey !== security.publicKey
      ) {
        // An extra number has no token of its own, its account's main one does
        const token = yield* _(
          userDb.findVexlNotificationTokenOfAccountByHash(security.serverHash)
        )

        if (Option.isSome(token)) {
          yield* _(Effect.logInfo('Sending notification to existing user'))
          yield* _(
            userNotificationService.notifyUserAboutLoginOnDifferentDevice(
              token.value
            )
          )
        } else {
          yield* _(
            Effect.logInfo(
              'Not sending notification to existing user, it has no token'
            )
          )
        }
      }

      return {exists: Option.isSome(existingUser)}
    }).pipe(makeEndpointEffect)
)
