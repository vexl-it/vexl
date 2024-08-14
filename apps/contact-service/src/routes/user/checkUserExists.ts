import {Schema} from '@effect/schema'
import {CheckUserExistsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {UserDbService} from '../../db/UserDbService'

export const checkUserExists = Handler.make(
  CheckUserExistsEndpoint,
  (_, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const userDb = yield* _(UserDbService)
        const user = yield* _(userDb.findUserByHash(security.hash))

        return {exists: Option.isSome(user)}
      }),
      Schema.Void
    )
)
