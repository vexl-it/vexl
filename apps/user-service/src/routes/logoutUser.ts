import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {LoggedInUsersDbService} from '../db/loggedInUsersDb'

export const logoutUserHandler = HttpApiBuilder.handler(
  UserApiSpecification,
  'root',
  'logoutUser',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const usersDb = yield* _(LoggedInUsersDbService)

      yield* _(usersDb.deleteUser(security.publicKey))

      return 'ok'
    }).pipe(makeEndpointEffect)
)
