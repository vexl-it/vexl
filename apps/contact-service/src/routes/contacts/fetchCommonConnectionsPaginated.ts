import {HttpApiBuilder} from '@effect/platform/index'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {appVersionSupportingV2KeysConfig} from '../../configs'
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
        Array.filter(
          (a) =>
            a !== security.publicKey &&
            (Option.isNone(security.publicKeyV2) ||
              a !== security.publicKeyV2.value)
        )
      )

      const pubKeysV1 = Array.filter(
        pubKeysToLookFor,
        (a): a is PublicKeyPemBase64 => !isPublicKeyV2(a)
      )
      const pubKeysV2 = Array.filter(pubKeysToLookFor, (a) => isPublicKeyV2(a))

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
              publicKeys: pubKeysV1,
              publicKeysV2: pubKeysV2,
              limit,
              userContactId: decodedNextPageToken?.lastUserContactId,
            }),
        })
      )

      const minimalVersionSupportingV2keys =
        yield* appVersionSupportingV2KeysConfig
      const clientVersion = Option.getOrElse(
        req.headers.clientVersionOrNone,
        () => 0
      )
      const clientSupportsV2Keys =
        clientVersion >= minimalVersionSupportingV2keys

      const commonFriendsWithClientHash = yield* _(
        toReturn.items,
        Array.map((oneContact) =>
          pipe(
            Effect.all({
              hashes: hashForClientBatch(oneContact.commonFriends),
              verifiedHashes: hashForClientBatch(oneContact.verifiedFriends),
            }),
            Effect.map(({hashes, verifiedHashes}) => ({
              publicKey: clientSupportsV2Keys
                ? (oneContact.publicKeyV2 ?? oneContact.publicKey)
                : oneContact.publicKey,
              common: {hashes, verifiedHashes},
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
