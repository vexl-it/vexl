import {type KeyHolder} from '@vexl-next/cryptography'
import {
  LocationStateE,
  OfferInfoE,
  OfferLocationE,
  OfferPrivatePartE,
  OfferPublicPartE,
  type OfferInfo,
  type OfferPrivatePart,
  type OfferPublicPart,
} from '@vexl-next/domain/src/general/offers'
import {
  compare,
  SemverStringE,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Either, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {pipe} from 'fp-ts/function'
import {aesGCMIgnoreTagDecrypt, eciesDecryptE} from '../utils/crypto'

export class DecryptingOfferError extends Schema.TaggedError<DecryptingOfferError>(
  'DecryptingOfferError'
)('DecryptingOfferError', {
  cause: Schema.Unknown,
  message: Schema.String,
  serverOffer: ServerOffer,
}) {}

export class NonCompatibleOfferVersionError extends Schema.TaggedError<NonCompatibleOfferVersionError>(
  'NonCompatibleOfferVersionError'
)('NonCompatibleOfferVersionError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

function decryptedPayloadsToOffer({
  serverOffer,
  privatePayload,
  publicPayload,
}: {
  serverOffer: ServerOffer
  privatePayload: OfferPrivatePart
  publicPayload: OfferPublicPart
}): Effect.Effect<Either.Either<OfferInfoE, ParseError>> {
  return pipe(
    Schema.decode(OfferInfoE)({
      id: serverOffer.id,
      offerId: serverOffer.offerId,
      privatePart: privatePayload,
      publicPart: publicPayload,
      createdAt: serverOffer.createdAt,
      modifiedAt: serverOffer.modifiedAt,
    }),
    Effect.either
  )
}

const OfferPublicPartIncludingLegacyPropsToDecrypt = Schema.Struct({
  ...OfferPublicPartE.fields,
  active: BooleanFromString,
  location: Schema.Unknown,
  locationV2: Schema.Array(OfferLocationE),
  locationState: LocationStateE,
  locationStateV2: Schema.Array(LocationStateE),
})

const OfferPublicPayloadUnion = Schema.Union(
  OfferPublicPartIncludingLegacyPropsToDecrypt,
  OfferPublicPartE
)

const firstSupportedSemverString = Schema.decodeSync(SemverStringE)('1.16.0')
const isSupportedOfferVersion = (
  offerStrign: string
): Effect.Effect<boolean, ParseError> =>
  pipe(
    offerStrign,
    Schema.decodeUnknown(
      Schema.parseJson(
        Schema.Struct({
          authorClientVersion: SemverStringE,
        })
      )
    ),
    Effect.map(({authorClientVersion}) => {
      return compare(authorClientVersion)('>=', firstSupportedSemverString)
    })
  )

// TODO write unit test for this function
export default function decryptOffer(
  privateKey: KeyHolder.PrivateKeyHolder
): (
  serverOffer: ServerOffer
) => Effect.Effect<
  OfferInfo,
  DecryptingOfferError | NonCompatibleOfferVersionError
> {
  return (serverOffer: ServerOffer) => {
    return Effect.gen(function* (_) {
      if (
        serverOffer.publicPayload.at(0) !== '0' ||
        serverOffer.privatePayload.at(0) !== '0' ||
        !isSupportedOfferVersion
      ) {
        return yield* _(
          Effect.fail(
            new NonCompatibleOfferVersionError({
              message: 'Non compatible offer version',
              cause: new Error('Non compatible offer version'),
            })
          )
        )
      }

      const privatePayload = yield* _(
        Effect.succeed(serverOffer.privatePayload.substring(1)),
        Effect.flatMap(eciesDecryptE(privateKey.privateKeyPemBase64)),
        Effect.flatMap(
          Schema.decodeUnknown(Schema.parseJson(OfferPrivatePartE))
        ),
        Effect.either
      )

      if (Either.isLeft(privatePayload)) {
        return yield* _(
          Effect.fail(
            new DecryptingOfferError({
              message: 'Error while decrypting offer',
              cause: privatePayload.left,
              serverOffer,
            })
          )
        )
      }

      const publicPayload = yield* _(
        Effect.succeed(serverOffer.publicPayload.substring(1)),
        Effect.flatMap(
          aesGCMIgnoreTagDecrypt(privatePayload.right.symmetricKey)
        ),
        Effect.flatMap(
          Schema.decodeUnknown(Schema.parseJson(OfferPublicPayloadUnion))
        ),
        Effect.map((offerPublicPart) => {
          if (
            Schema.is(OfferPublicPartIncludingLegacyPropsToDecrypt)(
              offerPublicPart
            )
          ) {
            const {locationV2, locationStateV2, ...rest} = offerPublicPart

            return {
              ...rest,
              location: locationV2,
              locationState: locationStateV2,
            } satisfies OfferPublicPart
          }

          return offerPublicPart
        }),
        Effect.either
      )

      if (Either.isLeft(publicPayload)) {
        return yield* _(
          Effect.fail(
            new DecryptingOfferError({
              message: 'Error while decrypting offer',
              cause: publicPayload.left,
              serverOffer,
            })
          )
        )
      }

      const offer = yield* _(
        decryptedPayloadsToOffer({
          serverOffer,
          privatePayload: privatePayload.right,
          publicPayload: publicPayload.right,
        })
      )

      if (Either.isLeft(offer)) {
        return yield* _(
          Effect.fail(
            new DecryptingOfferError({
              message: 'Error while decrypting offer',
              cause: offer.left,
              serverOffer,
            })
          )
        )
      }

      return offer.right
    })
  }
}
