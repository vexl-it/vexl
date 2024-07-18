import {LogoutUserEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {LoggedInUsersDbService} from '../db/loggedInUsersDb'

export const logoutUserHandler = Handler.make(
  LogoutUserEndpoint,
  (_, security) =>
    Effect.gen(function* (_) {
      const usersDb = yield* _(LoggedInUsersDbService)

      yield* _(usersDb.deleteUser(security['public-key']))

      return 'ok'
    })
)
