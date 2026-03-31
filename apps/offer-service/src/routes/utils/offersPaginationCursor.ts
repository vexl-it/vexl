import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  IsoDatetimeString,
  MINIMAL_DATE,
} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {DateTime} from 'luxon'

const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(PrivatePartRecordId)('0')

export const OffersPaginationNextPageToken = Schema.Struct({
  lastModifiedAt: IsoDatetimeString,
  lastPrivatePartId: PrivatePartRecordId,
  replaySameDateOnNextUse: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
})
export type OffersPaginationNextPageToken =
  typeof OffersPaginationNextPageToken.Type

const LegacyOffersPaginationNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})

const defaultOffersPaginationNextPageToken: OffersPaginationNextPageToken = {
  lastModifiedAt: MINIMAL_DATE,
  lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID,
  replaySameDateOnNextUse: false,
}

const resolveOffersPaginationNextPageToken = (
  token: OffersPaginationNextPageToken
): OffersPaginationNextPageToken => {
  if (!token.replaySameDateOnNextUse) {
    return token
  }

  return {
    ...token,
    lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID,
    replaySameDateOnNextUse: false,
  }
}

const isCurrentDate = (isoDatetime: IsoDatetimeString): boolean =>
  DateTime.fromISO(isoDatetime).toISODate() === DateTime.now().toISODate()

export const decodeOffersPaginationNextPageToken = (
  nextPageToken: string | undefined
): Effect.Effect<OffersPaginationNextPageToken, ParseError> => {
  if (!nextPageToken) {
    return Effect.succeed(defaultOffersPaginationNextPageToken)
  }

  return Effect.gen(function* (_) {
    const decoded = yield* _(
      base64UrlStringToDecoded({
        base64UrlString: nextPageToken,
        decodeSchema: Schema.Unknown,
      })
    )

    return yield* _(
      Schema.decodeUnknown(OffersPaginationNextPageToken)(decoded).pipe(
        Effect.catchTag('ParseError', (newTokenParseError) =>
          Schema.decodeUnknown(LegacyOffersPaginationNextPageToken)(
            decoded
          ).pipe(
            Effect.as(defaultOffersPaginationNextPageToken),
            Effect.catchTag('ParseError', () => Effect.fail(newTokenParseError))
          )
        )
      )
    )
  })
}

export const encodeOffersPaginationNextPageToken = ({
  offer,
  replaySameDateOnNextUse,
}: {
  offer: ServerOffer
  replaySameDateOnNextUse: boolean
}): Effect.Effect<string, ParseError> =>
  objectToBase64UrlEncoded({
    object: {
      lastModifiedAt: offer.modifiedAt,
      lastPrivatePartId: Schema.decodeSync(PrivatePartRecordId)(
        offer.id.toString()
      ),
      replaySameDateOnNextUse,
    },
    schema: OffersPaginationNextPageToken,
  })

export const getOffersPaginationCursorForQuery = (
  nextPageToken: string | undefined
): Effect.Effect<OffersPaginationNextPageToken, ParseError> =>
  decodeOffersPaginationNextPageToken(nextPageToken).pipe(
    Effect.map(resolveOffersPaginationNextPageToken)
  )

export const shouldReplaySameDateOnNextUse = ({
  hasNext,
  offer,
}: {
  hasNext: boolean
  offer: ServerOffer
}): boolean => !hasNext && isCurrentDate(offer.modifiedAt)
