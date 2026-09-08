import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {LoggedInUsersDbService} from '../db/loggedInUsersDb'

export const logoutUserHandler = makeHttpApiHandler(
  UserApiSpecification,
  'root',
  'logoutUser',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const usersDb = yield* LoggedInUsersDbService

      yield* usersDb.deleteUser(security.publicKey)

      return 'ok'
    }).pipe(makeEndpointEffect)
)
