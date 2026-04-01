import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {Effect, Schema} from 'effect'
import {
  OfferChangeCounter,
  type OfferPartsWithOfferForUserUpdateCounter,
} from '../../db/OfferDbService/domain'

const DEFAULT_LAST_OFFER_CHANGE_COUNTER =
  Schema.decodeSync(OfferChangeCounter)('0')
const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(PrivatePartRecordId)('0')

export const PaginatedOfferNextPageToken = Schema.Struct({
  lastOfferChangeCounter: OfferChangeCounter,
  lastPrivatePartId: PrivatePartRecordId,
})
export type PaginatedOfferNextPageToken =
  typeof PaginatedOfferNextPageToken.Type

export const LegacyPaginatedOfferNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})

export const defaultPaginatedOfferNextPageToken: PaginatedOfferNextPageToken = {
  lastOfferChangeCounter: DEFAULT_LAST_OFFER_CHANGE_COUNTER,
  lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID,
}

export const decodePaginatedOfferNextPageToken = ({
  nextPageToken,
}: {
  nextPageToken: string | undefined
}): Effect.Effect<PaginatedOfferNextPageToken, InvalidNextPageTokenError> =>
  Effect.gen(function* (_) {
    if (!nextPageToken) {
      return defaultPaginatedOfferNextPageToken
    }

    return yield* _(
      base64UrlStringToDecoded({
        base64UrlString: nextPageToken,
        decodeSchema: PaginatedOfferNextPageToken,
      }).pipe(
        Effect.catchTag('ParseError', (newTokenError) =>
          base64UrlStringToDecoded({
            base64UrlString: nextPageToken,
            decodeSchema: LegacyPaginatedOfferNextPageToken,
          }).pipe(
            Effect.as(defaultPaginatedOfferNextPageToken),
            Effect.catchTag('ParseError', () => Effect.fail(newTokenError))
          )
        )
      )
    )
  }).pipe(
    Effect.catchTag('ParseError', (cause) =>
      Effect.fail(
        new InvalidNextPageTokenError({
          cause,
        })
      )
    )
  )

export const encodePaginatedOfferNextPageToken = ({
  offer,
}: {
  offer: OfferPartsWithOfferForUserUpdateCounter
}): Effect.Effect<string, InvalidNextPageTokenError> =>
  objectToBase64UrlEncoded({
    object: {
      lastOfferChangeCounter: offer.offerForUserUpdateCounter,
      lastPrivatePartId: offer.privatePart.id,
    },
    schema: PaginatedOfferNextPageToken,
  }).pipe(
    Effect.catchTag('ParseError', (cause) =>
      Effect.fail(
        new InvalidNextPageTokenError({
          cause,
        })
      )
    )
  )
