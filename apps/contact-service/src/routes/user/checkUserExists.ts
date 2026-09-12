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
        Option.isSome(existingUser)
      ) {
        yield* _(Effect.logInfo('Sending notification to existing user'))

        if (Option.isSome(existingUser.value.vexlNotificationToken)) {
          yield* _(
            userNotificationService.notifyUserAboutLoginOnDifferentDevice(
              existingUser.value.vexlNotificationToken.value
            )
          )
        } else {
          yield* _(
            Effect.logInfo('Not sending notification to existing user', {
              notifyParam: req.urlParams.notifyExistingUserAboutLogin,
              existingUserExists: Option.isSome(existingUser),
              existingUserHasToken:
                Option.isSome(existingUser) &&
                Option.isSome(existingUser.value.vexlNotificationToken),
            })
          )
        }
      }

      return {exists: Option.isSome(existingUser)}
    }).pipe(makeEndpointEffect)
)
