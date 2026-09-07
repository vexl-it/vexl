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
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {BooleanFromString} from '@vexl-next/generic-utils/src/effect-helpers/BooleanFromString'
import {
  CryptoBoxCypher,
  cryptoBoxUnseal,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {Effect, flow, pipe, Result, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
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
}): Effect.Effect<Result.Result<OfferInfo, SchemaError>> {
  return pipe(
    Schema.decodeEffect(OfferInfo)({
      id: serverOffer.id,
      offerId: serverOffer.offerId,
      privatePart: privatePayload,
      publicPart: publicPayload,
      createdAt: serverOffer.createdAt,
      modifiedAt: serverOffer.modifiedAt,
    }),
    Effect.result
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

const OfferPublicPayloadUnion = Schema.Union([
  OfferPublicPartIncludingLegacyPropsToDecrypt,
  OfferPublicPart,
])

const firstSupportedVersionString = Schema.decodeSync(VersionString)('1.16.0')
const ensureOfferFromSupportedClient = (
  offerStrign: string
): Effect.Effect<void, NonCompatibleOfferVersionError> =>
  pipe(
    offerStrign,
    Schema.decodeUnknownEffect(
      Schema.fromJsonString(
        Schema.Struct({
          authorClientVersion: VersionString,
        })
      )
    ),
    Effect.filterOrFail(({authorClientVersion}) => {
      return compare(authorClientVersion)('>=', firstSupportedVersionString)
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
    return Effect.gen(function* () {
      const isV1 = Schema.is(PrivatePayloadEncryptedV1)(
        serverOffer.privatePayload
      )
      const isV2 = Schema.is(PrivatePayloadEncryptedV2)(
        serverOffer.privatePayload
      )

      if (!isV1 && !isV2) {
        return yield* Effect.fail(
          new NonCompatibleOfferVersionError({
            message: 'Non compatible offer cypher version',
            cause: new Error('Non compatible offer cypher version'),
          })
        )
      }

      const privatePayload = yield* pipe(
        serverOffer.privatePayload.substring(1),
        isV1
          ? eciesDecryptE(privateKey.privateKeyPemBase64)
          : flow(
              Schema.decodeEffect(CryptoBoxCypher),
              Effect.flatMap(cryptoBoxUnseal(privateKeyV2))
            ),
        Effect.flatMap(
          Schema.decodeUnknownEffect(Schema.fromJsonString(OfferPrivatePart))
        ),
        Effect.result
      )

      if (Result.isFailure(privatePayload)) {
        return yield* Effect.fail(
          new DecryptingOfferError({
            message: 'Error while decrypting offer',
            cause: privatePayload.failure,
            serverOffer,
          })
        )
      }

      const publicPayload = yield* pipe(
        Effect.succeed(serverOffer.publicPayload.substring(1)),
        Effect.flatMap(
          aesGCMIgnoreTagDecrypt(privatePayload.success.symmetricKey)
        ),
        Effect.tap(ensureOfferFromSupportedClient),
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.fromJsonString(OfferPublicPayloadUnion)
          )
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
        Effect.result
      )

      if (Result.isFailure(publicPayload)) {
        return yield* Effect.fail(
          new DecryptingOfferError({
            message: 'Error while decrypting offer',
            cause: publicPayload.failure,
            serverOffer,
          })
        )
      }

      const offer = yield* decryptedPayloadsToOffer({
        serverOffer,
        privatePayload: privatePayload.success,
        publicPayload: publicPayload.success,
      })

      if (Result.isFailure(offer)) {
        return yield* Effect.fail(
          new DecryptingOfferError({
            message: 'Error while decrypting offer',
            cause: offer.failure,
            serverOffer,
          })
        )
      }

      return offer.success
    })
  }
}
