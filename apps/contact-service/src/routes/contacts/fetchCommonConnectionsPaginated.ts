import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {type FindCommonFriendsPaginatedResult} from '../../db/ContactDbService/queries/createFindCommonFriendsByOwnerHashAndPublicKeysPaginated'
import {
  hashForClientBatch,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'

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
      const security = yield* _(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
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
              ownerHash: security.serverHash,
              publicKeys: pubKeysToLookFor,
              limit,
              userContactId: decodedNextPageToken?.lastUserContactId,
            }),
        })
      )

      const commonFriendsWithClientHash = yield* _(
        toReturn.items,
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
        ...toReturn,
        items: commonFriendsWithClientHash,
      }
    }).pipe(makeEndpointEffect)
)
