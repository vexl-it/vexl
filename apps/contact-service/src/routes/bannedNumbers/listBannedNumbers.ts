import {HttpApiBuilder} from '@effect/platform/index'
import {BannedNumberId} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {BannedNumberDbService} from '../../db/BannedNumberDbService'
import {type BannedNumberListItem} from '../../db/BannedNumberDbService/queries/createListBannedNumbers'

const ListBannedNumbersNextPageToken = Schema.Struct({
  beforeId: Schema.optional(BannedNumberId),
})

export const listBannedNumbers = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'BannedNumbersAdmin',
  'listBannedNumbers',
  (req) =>
    Effect.gen(function* (_) {
      const bannedNumberDb = yield* _(BannedNumberDbService)

      return yield* _(
        createPaginatedResponse({
          nextPageTokenSchema: ListBannedNumbersNextPageToken,
          nextPageToken: req.payload.nextPageToken,
          defaultNextPageToken: {},
          limit: req.payload.limit,
          createNextPageToken: (lastItem: BannedNumberListItem) => ({
            beforeId: lastItem.id,
          }),
          dbEffectToRun: ({limit, decodedNextPageToken}) =>
            bannedNumberDb.listBannedNumbers({
              search: req.payload.search?.trim() ?? '',
              beforeId: decodedNextPageToken.beforeId,
              limit,
            }),
        })
      )
    }).pipe(makeEndpointEffect)
)
