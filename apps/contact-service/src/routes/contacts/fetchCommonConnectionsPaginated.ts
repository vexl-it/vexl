import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {type FindCommonFriendsPaginatedResult} from '../../db/ContactDbService/queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'

const DEFAULT_LAST_USER_CONTACT_ID = 0

export const FetchCommonConnectionsNextPageToken = Schema.Struct({
  lastUserContactId: Schema.Int,
})

export const fetchCommonConnectionsPaginated = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchCommonConnectionsPaginated',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const contactDb = yield* _(ContactDbService)
      const pubKeysToLookFor = pipe(
        req.payload.publicKeys,
        Array.dedupe,
        Array.filter((a) => a !== security['public-key'])
      )

      const toReturn = yield* _(
        createPaginatedResponse({
          nextPageTokenSchema: FetchCommonConnectionsNextPageToken,
          nextPageToken: req.payload.nextPageToken,
          defaultNextPageToken: {
            lastUserContactId: DEFAULT_LAST_USER_CONTACT_ID,
          },
          limit: req.payload.limit,
          createNextPageToken: (
            lastItem: FindCommonFriendsPaginatedResult
          ) => ({
            lastUserContactId: lastItem.userContactId,
          }),
          dbEffectToRun: ({limit, decodedNextPageToken}) =>
            contactDb.findCommonFriendsPaginated({
              ownerHash: security.hash,
              publicKeys: pubKeysToLookFor,
              limit,
              userContactId: decodedNextPageToken?.lastUserContactId,
            }),
        })
      )

      return {
        ...toReturn,
        items: Array.map(toReturn.items, (oneContact: any) => ({
          publicKey: oneContact.publicKey,
          common: {hashes: oneContact.commonFriends},
        })),
      }
    }).pipe(makeEndpointEffect)
)
