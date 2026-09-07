import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option, pipe} from 'effect'
import {UserDbService} from '../../db/UserDbService'
import {UserNotificationService} from '../../services/UserNotificationService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const checkUserExists = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'checkUserExists',
  (req) =>
    Effect.gen(function* () {
      const security = yield* pipe(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const userDb = yield* UserDbService
      const userNotificationService = yield* UserNotificationService
      const existingUser = yield* userDb.findUserByHash(security.serverHash)

      if (
        req.query.notifyExistingUserAboutLogin &&
        Option.isSome(existingUser)
      ) {
        yield* Effect.logInfo('Sending notification to existing user')

        // todo #2124: remove expoToken after moving to vexlNotificationToken
        if (
          Option.isSome(existingUser.value.vexlNotificationToken) ||
          Option.isSome(existingUser.value.expoToken)
        ) {
          yield* userNotificationService.notifyUserAboutLoginOnDifferentDevice(
            Option.getOrNull(existingUser.value.vexlNotificationToken),
            Option.getOrNull(existingUser.value.expoToken)
          )
        } else {
          yield* Effect.logInfo('Not sending notification to existing user', {
            notifyParam: req.query.notifyExistingUserAboutLogin,
            existingUserExists: Option.isSome(existingUser),
            existingUserHasToken:
              Option.isSome(existingUser) &&
              (Option.isSome(existingUser.value.vexlNotificationToken) ||
                Option.isSome(existingUser.value.expoToken)),
          })
        }
      }

      return {exists: Option.isSome(existingUser)}
    }).pipe(makeEndpointEffect)
)
