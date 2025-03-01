import {
  LocationStateToArrayE,
  OfferLocationE,
  OfferPublicPartE,
  PublicPayloadEncryptedE,
  type LocationState,
  type OfferPublicPart,
  type PublicPayloadEncrypted,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Array, Effect, flow, Schema} from 'effect'
import {pipe} from 'fp-ts/function'
import {aesGCMIgnoreTagEncrypt} from '../../utils/crypto'
import {stringifyE} from '../../utils/parsing'

function convertLocationStateToOldVersion(
  publicPart: OfferPublicPart
): LocationState {
  if (publicPart.listingType === 'BITCOIN')
    return publicPart.locationState[0] ?? ('IN_PERSON' as const)

  if (publicPart.listingType === 'OTHER' && publicPart.location.length === 0)
    return 'ONLINE'

  if (publicPart.listingType === 'OTHER' && publicPart.location.length > 0)
    return 'IN_PERSON'

  if (publicPart.locationState.length === 2) return 'IN_PERSON'

  if (publicPart.locationState.length === 1)
    return publicPart.locationState[0] ?? 'IN_PERSON'

  return 'IN_PERSON'
}

export class PublicPartEncryptionError extends Schema.TaggedError<PublicPartEncryptionError>(
  'PublicPartEncryptionError'
)('PublicPartEncryptionError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}

export type ErrorEncryptingPublicPart = BasicError<'ErrorEncryptingPublicPart'>

const OfferPublicPartIncludingLegacyPropsToEncrypt = Schema.Struct({
  ...OfferPublicPartE.fields,
  active: Schema.Literal('true', 'false'),
  location: Schema.Array(Schema.String),
  locationV2: Schema.Array(OfferLocationE),
  locationState: Schema.String,
  locationStateV2: LocationStateToArrayE,
})

type OfferPublicPartIncludingLegacyPropsToEncrypt = Schema.Schema.Type<
  typeof OfferPublicPartIncludingLegacyPropsToEncrypt
>

export default function encryptOfferPublicPayload({
  offerPublicPart,
  symmetricKey,
}: {
  offerPublicPart: OfferPublicPart
  symmetricKey: SymmetricKey
}): Effect.Effect<PublicPayloadEncrypted, PublicPartEncryptionError> {
  const legacyLocations = pipe(
    Effect.succeed(offerPublicPart.location),
    Effect.map(
      flow(
        Array.map((one) => ({
          longitude: String(one.longitude),
          latitude: String(one.latitude),
          city: one.shortAddress,
        })),
        Array.map((one) => stringifyE(one)),
        Effect.all
      )
    ),
    Effect.flatten,
    Effect.runSync
  )

  return pipe(
    Effect.succeed(offerPublicPart),
    Effect.map((publicPart) => {
      return {
        ...publicPart,
        active: publicPart.active ? 'true' : 'false',
        location: legacyLocations,
        locationV2: publicPart.location,
        locationState: convertLocationStateToOldVersion(publicPart),
        locationStateV2: publicPart.locationState,
      } satisfies OfferPublicPartIncludingLegacyPropsToEncrypt
    }),
    Effect.flatMap(
      Schema.encode(
        Schema.parseJson(OfferPublicPartIncludingLegacyPropsToEncrypt)
      )
    ),
    Effect.flatMap(aesGCMIgnoreTagEncrypt(symmetricKey)),
    Effect.map((encrypted) => `0${encrypted}`),
    Effect.map(flow(Schema.decode(PublicPayloadEncryptedE), Effect.runSync)),
    Effect.mapError(
      (e) => new PublicPartEncryptionError({message: e.message, cause: e.cause})
    )
  )
}
