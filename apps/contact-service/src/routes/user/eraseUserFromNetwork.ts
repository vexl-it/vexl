import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {verifyAndDecodeShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'

export const eraseUserFromNetwork = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'eraseUserFromNetwork',
  (req) =>
    Effect.gen(function* (_) {
      const {phoneNumberHash} = yield* _(
        verifyAndDecodeShortLivedTokenForErasingUser(req.payload.token)
      )

      const userDb = yield* _(UserDbService)
      const contactDb = yield* _(ContactDbService)

      yield* _(contactDb.deleteContactsByHashFrom(phoneNumberHash))
      yield* _(
        userDb.findUserByHash(phoneNumberHash),
        Effect.flatten,
        Effect.flatMap((user) =>
          userDb.deleteUserByPublicKeyAndHash({
            hash: phoneNumberHash,
            publicKey: user.publicKey,
          })
        ),
        Effect.catchTag('NoSuchElementException', (e) => Effect.void)
      )

      return {erased: 'ok' as const}
    }).pipe(makeEndpointEffect)
)
