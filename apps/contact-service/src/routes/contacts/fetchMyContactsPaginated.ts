import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult} from '../../db/ContactDbService/queries/createFindFirstLevelContactsPublicKeysByHashFromPaginated'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {toCompatiblePublicKeyArray} from '../../utils/toCompatiblePublicKeyArray'

const DEFAULT_LAST_USER_ID = 0

export const FetchMyContactsNextPageToken = Schema.Struct({
  userId: Schema.Int,
})
type FetchMyContactsNextPageToken = typeof FetchMyContactsNextPageToken.Type

// TODO create V2
export const fetchMyContactsPaginated = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchMyContactsPaginated',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const contactDb = yield* _(ContactDbService)

      yield* _(
        UserDbService,
        Effect.flatMap((userDb) =>
          userDb.updateAppSourceForUser({
            appSource: req.headers.appSourceOrNone,
            publicKey: security.publicKey,
            hash: security.serverHash,
          })
        )
      )

      const toReturn = yield* _(
        createPaginatedResponse({
          nextPageTokenSchema: FetchMyContactsNextPageToken,
          nextPageToken: req.urlParams.nextPageToken,
          defaultNextPageToken: {
            userId: DEFAULT_LAST_USER_ID,
          },
          limit: req.urlParams.limit,
          createNextPageToken: (
            lastItem: FindFirstLevelContactsPublicKeysByHashFromPaginatedResult
          ) => ({
            userId: lastItem.userId,
          }),
          dbEffectToRun: ({limit, decodedNextPageToken}) =>
            req.urlParams.level === 'FIRST'
              ? contactDb.findFirstLevelContactsPublicKeysByHashFromPaginated({
                  hashFrom: security.serverHash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                })
              : contactDb.findSecondLevelContactsPublicKeysByHashFromPaginated({
                  hashFrom: security.serverHash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                }),
        }),
        Effect.withSpan('Fetch first level contacts')
      )

      const contactsWithoutOwner = pipe(
        toReturn.items,
        // Do not return the owner as a contact
        Array.filter(
          (contact) =>
            contact.publicKey !== security.publicKey &&
            Option.getOrElse(contact.publicKeyV2, () => 'no-key-contact') !==
              Option.getOrElse(security.publicKeyV2, () => 'no-key-security')
        )
      )

      const contactsWithCompatiblePublicKeys =
        yield* toCompatiblePublicKeyArray(req.headers.clientVersionOrNone)(
          contactsWithoutOwner
        )

      return {
        ...toReturn,
        items: contactsWithCompatiblePublicKeys,
      }
    }).pipe(
      Effect.withSpan('Fetch my contacts paginated', {
        attributes: {level: req.urlParams.level},
      }),
      makeEndpointEffect
    )
)
