import {FetchCommonConnectionsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'

export const fetchCommonConnections = Handler.make(
  FetchCommonConnectionsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const pubKeysToLookFor = pipe(
          req.body.publicKeys,
          Array.dedupe,
          Array.filter((a) => a !== security['public-key'])
        )

        const contactDb = yield* _(ContactDbService)
        const commonFriends = yield* _(
          contactDb.findCommonFriends({
            ownerHash: security.hash,
            publicKeys: pubKeysToLookFor,
          })
        )

        return {
          commonContacts: Array.map(commonFriends, (oneContact) => ({
            publicKey: oneContact.publicKey,
            common: {hashes: oneContact.commonFriends},
          })),
        }
      }),
      Schema.Void
    )
)
