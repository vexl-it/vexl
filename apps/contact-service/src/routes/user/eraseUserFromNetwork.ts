import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {verifyAndDecodeShortLivedTokenForErasingUser} from '@vexl-next/server-utils/src/shortLivedTokenForErasingUserUtils'
import {Effect, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const eraseUserFromNetwork = makeHttpApiHandler(
  ContactApiSpecification,
  'User',
  'eraseUserFromNetwork',
  (req) =>
    Effect.gen(function* () {
      const {phoneNumberHash} =
        yield* verifyAndDecodeShortLivedTokenForErasingUser(req.payload.token)
      const serverHash = yield* serverHashPhoneNumber(phoneNumberHash)

      const userDb = yield* UserDbService
      const contactDb = yield* ContactDbService

      yield* contactDb.deleteContactsByHashFrom(serverHash)
      yield* pipe(
        userDb.findUserByHash(serverHash),
        Effect.flatMap(Effect.fromOption),
        Effect.flatMap((user) =>
          userDb.deleteUserByPublicKeyAndHash({
            hash: serverHash,
            publicKey: user.publicKey,
          })
        ),
        Effect.catchTag('NoSuchElementError', (e) => Effect.void)
      )

      return {erased: 'ok' as const}
    }).pipe(makeEndpointEffect)
)
