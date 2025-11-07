import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {verifyAndDecodeShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const eraseUserFromNetwork = HttpApiBuilder.handler(
  ContactApiSpecification,
  'User',
  'eraseUserFromNetwork',
  (req) =>
    Effect.gen(function* (_) {
      const {phoneNumberHash} = yield* _(
        verifyAndDecodeShortLivedTokenForErasingUser(req.payload.token)
      )
      const serverHash = yield* _(serverHashPhoneNumber(phoneNumberHash))

      const userDb = yield* _(UserDbService)
      const contactDb = yield* _(ContactDbService)

      yield* _(contactDb.deleteContactsByHashFrom(serverHash))
      yield* _(
        userDb.findUserByHash(serverHash),
        Effect.flatten,
        Effect.flatMap((user) =>
          userDb.deleteUserByPublicKeyAndHash({
            hash: serverHash,
            publicKey: user.publicKey,
          })
        ),
        Effect.catchTag('NoSuchElementException', (e) => Effect.void)
      )

      return {erased: 'ok' as const}
    }).pipe(makeEndpointEffect)
)
