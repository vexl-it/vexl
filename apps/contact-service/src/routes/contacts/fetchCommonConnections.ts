import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'

export const fetchCommonConnections = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchCommonConnections',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const pubKeysToLookFor = pipe(
        req.payload.publicKeys,
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
    }).pipe(makeEndpointEffect)
)
