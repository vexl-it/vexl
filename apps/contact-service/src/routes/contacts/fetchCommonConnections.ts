import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {
  hashForClientBatch,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'

export const fetchCommonConnections = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchCommonConnections',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const userServerHash = yield* _(serverHashPhoneNumber(security.hash))

      const pubKeysToLookFor = pipe(
        req.payload.publicKeys,
        Array.dedupe,
        Array.filter((a) => a !== security.publicKey)
      )

      const contactDb = yield* _(ContactDbService)
      const commonFriends = yield* _(
        contactDb.findCommonFriends({
          ownerHash: userServerHash,
          publicKeys: pubKeysToLookFor,
        })
      )

      const commonFriendsWithClientHash = yield* _(
        commonFriends,
        Array.map((oneContact) =>
          pipe(
            hashForClientBatch(oneContact.commonFriends),
            Effect.map((hashes) => ({
              publicKey: oneContact.publicKey,
              common: {hashes},
            }))
          )
        ),
        Effect.allWith({concurrency: 'unbounded'})
      )

      return {
        commonContacts: commonFriendsWithClientHash,
      }
    }).pipe(makeEndpointEffect)
)
