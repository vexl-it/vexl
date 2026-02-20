import {type KeyHolder} from '@vexl-next/cryptography'
import {
  LocationState,
  OfferInfo,
  OfferLocation,
  OfferPrivatePart,
  OfferPublicPart,
  PrivatePayloadEncryptedV1,
  PrivatePayloadEncryptedV2,
} from '@vexl-next/domain/src/general/offers'
import {
  compare,
  SemverString,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {
  CryptoBoxCypher,
  cryptoBoxUnseal,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, Either, flow, Schema} from 'effect'
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
}): Effect.Effect<Either.Either<OfferInfo, ParseError>> {
  return pipe(
    Schema.decode(OfferInfo)({
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
  ...OfferPublicPart.fields,
  active: BooleanFromString,
  location: Schema.Unknown,
  locationV2: Schema.Array(OfferLocation),
  locationState: LocationState,
  locationStateV2: Schema.Array(LocationState),
})

const OfferPublicPayloadUnion = Schema.Union(
  OfferPublicPartIncludingLegacyPropsToDecrypt,
  OfferPublicPart
)

const firstSupportedSemverString = Schema.decodeSync(SemverString)('1.16.0')
const ensureOfferFromSupportedClient = (
  offerStrign: string
): Effect.Effect<void, NonCompatibleOfferVersionError> =>
  pipe(
    offerStrign,
    Schema.decodeUnknown(
      Schema.parseJson(
        Schema.Struct({
          authorClientVersion: SemverString,
        })
      )
    ),
    Effect.filterOrFail(({authorClientVersion}) => {
      return compare(authorClientVersion)('>=', firstSupportedSemverString)
    }),
    Effect.mapError(
      () =>
        new NonCompatibleOfferVersionError({
          message: 'Non compatible offer version based on decrypted offer',
          cause: new Error(
            'Non compatible offer version based on decrypted offer'
          ),
        })
    )
  )

// TODO write unit test for this function
export default function decryptOffer(
  privateKey: KeyHolder.PrivateKeyHolder,
  privateKeyV2: KeyHolder.KeyPairV2
): (
  serverOffer: ServerOffer
) => Effect.Effect<
  OfferInfo,
  DecryptingOfferError | NonCompatibleOfferVersionError
> {
  return (serverOffer: ServerOffer) => {
    return Effect.gen(function* (_) {
      const isV1 = Schema.is(PrivatePayloadEncryptedV1)(
        serverOffer.privatePayload
      )
      const isV2 = Schema.is(PrivatePayloadEncryptedV2)(
        serverOffer.privatePayload
      )

      if (!isV1 && !isV2) {
        return yield* _(
          Effect.fail(
            new NonCompatibleOfferVersionError({
              message: 'Non compatible offer cypher version',
              cause: new Error('Non compatible offer cypher version'),
            })
          )
        )
      }

      const privatePayload = yield* _(
        serverOffer.privatePayload.substring(1),
        isV1
          ? eciesDecryptE(privateKey.privateKeyPemBase64)
          : flow(
              Schema.decode(CryptoBoxCypher),
              Effect.flatMap(cryptoBoxUnseal(privateKeyV2))
            ),
        Effect.flatMap(
          Schema.decodeUnknown(Schema.parseJson(OfferPrivatePart))
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
        Effect.tap(ensureOfferFromSupportedClient),
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
