import {PrivatePartRecordId} from '@vexl-next/domain/src/general/offers'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {PublicPartVersion} from '../../db/OfferDbService/domain'

const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(PrivatePartRecordId)('0')
const DEFAULT_LAST_PUBLIC_PART_VERSION =
  Schema.decodeSync(PublicPartVersion)('0')

export const OffersPaginationNextPageToken = Schema.Struct({
  lastPublicPartVersion: PublicPartVersion,
  lastPrivatePartId: PrivatePartRecordId,
})
export type OffersPaginationNextPageToken =
  typeof OffersPaginationNextPageToken.Type

const LegacyOffersPaginationNextPageToken = Schema.Struct({
  lastPrivatePartId: PrivatePartRecordId,
})

const defaultOffersPaginationNextPageToken: OffersPaginationNextPageToken = {
  lastPublicPartVersion: DEFAULT_LAST_PUBLIC_PART_VERSION,
  lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID,
}

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
  lastPublicPartVersion,
  lastPrivatePartId,
}: {
  lastPublicPartVersion: PublicPartVersion
  lastPrivatePartId: PrivatePartRecordId
}): Effect.Effect<string, ParseError> =>
  objectToBase64UrlEncoded({
    object: {
      lastPublicPartVersion,
      lastPrivatePartId,
    },
    schema: OffersPaginationNextPageToken,
  })
