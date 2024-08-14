import {Schema} from '@effect/schema'
import {FetchCommonConnectionsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

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
      }).pipe(withDbTransaction, withUserActionRedisLock(security.hash)),
      Schema.Void
    )
)
