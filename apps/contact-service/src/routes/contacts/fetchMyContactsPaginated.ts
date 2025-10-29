import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe, Schema} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult} from '../../db/ContactDbService/queries/createFindFirstLevelContactsPublicKeysByHashFromPaginated'
import {UserDbService} from '../../db/UserDbService'

const DEFAULT_LAST_USER_ID = 0

export const FetchMyContactsNextPageToken = Schema.Struct({
  userId: Schema.Int,
})
type FetchMyContactsNextPageToken = typeof FetchMyContactsNextPageToken.Type

export const fetchMyContactsPaginated = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchMyContactsPaginated',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const contactDb = yield* _(ContactDbService)

      yield* _(
        UserDbService,
        Effect.flatMap((userDb) =>
          userDb.updateAppSourceForUser({
            appSource: req.headers.appSourceOrNone,
            publicKey: security['public-key'],
            hash: security.hash,
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
                  hashFrom: security.hash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                })
              : contactDb.findSecondLevelContactsPublicKeysByHashFromPaginated({
                  hashFrom: security.hash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                }),
        }),
        Effect.withSpan('Fetch first level contacts')
      )

      return {
        ...toReturn,
        items: pipe(
          toReturn.items,
          Array.map((oneContact) => oneContact.publicKey),
          Array.filter((publicKey) => publicKey !== security['public-key'])
        ),
      }
    }).pipe(
      Effect.withSpan('Fetch my contacts paginated', {
        attributes: {level: req.urlParams.level},
      }),
      makeEndpointEffect
    )
)
