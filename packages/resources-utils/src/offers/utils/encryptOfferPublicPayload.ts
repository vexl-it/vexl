import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {
  LocationStateToArray,
  OfferLocation,
  PublicPayloadEncrypted,
  type LocationState,
  type OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/src/general/offers'
import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {z} from 'zod'
import {booleanToString} from '../../utils/booleanString'
import {aesGCMIgnoreTagEncrypt} from '../../utils/crypto'
import {safeParse, stringifyToJson} from '../../utils/parsing'

const OfferLocationDeprecated = z.object({
  longitude: z.string(),
  latitude: z.string(),
  city: z.string(),
})
type OfferLocationDeprecated = z.TypeOf<typeof OfferLocationDeprecated>

/**
 * Shape of the offer public part that is encrypted.
 * Handles backward compatibility
 */
const OfferPublicPartToEncrypt = z.object({
  offerPublicKey: PublicKeyPemBase64,
  // TODO(#702): remove offer location backward compatibility
  // location V2 -> location
  location: z.array(z.string()),
  locationV2: z.array(OfferLocation),
  offerDescription: z.string(),
  amountBottomLimit: z.coerce.string(),
  amountTopLimit: z.coerce.string(),
  feeState: z.string(),
  feeAmount: z.coerce.string(),
  // TODO: remove offer locationState backward compatibility
  // locationState V2 -> locationState
  locationState: z.string(),
  locationStateV2: LocationStateToArray,
  paymentMethod: z.array(z.string()),
  btcNetwork: z.array(z.string()),
  currency: z.string(),
  offerType: z.string(),
  spokenLanguages: z.array(z.string()).optional(),
  expirationDate: JSDateString.optional(),
  activePriceState: z.string(),
  activePriceValue: z.coerce.string(),
  activePriceCurrency: z.string(),
  active: z.enum(['true', 'false']),
  groupUuids: z.array(z.string()),
  listingType: z.string(),
  singlePriceState: z.string().optional(),
  fcmCypher: FcmCypher.optional(),
})

function convertLocationStateToOldVersion(
  publicPart: OfferPublicPart
): LocationState {
  if (publicPart.listingType === 'BITCOIN')
    return publicPart.locationState[0] ?? 'IN_PERSON'

  if (publicPart.listingType === 'OTHER' && publicPart.location.length === 0)
    return 'ONLINE'

  if (publicPart.locationState.length === 2) return 'IN_PERSON'

  if (publicPart.locationState.length === 1)
    return publicPart.locationState[0] ?? 'IN_PERSON'

  return 'IN_PERSON'
}

function offerPublicPartToJsonString(
  publicPart: OfferPublicPart
): E.Either<unknown, string> {
  return pipe(
    publicPart.location,
    A.map(
      (oneLocation) =>
        ({
          longitude: String(oneLocation.longitude),
          latitude: String(oneLocation.latitude),
          city: oneLocation.shortAddress,
        }) satisfies OfferLocationDeprecated
    ),
    A.map(stringifyToJson),
    A.sequence(E.Applicative),
    E.map((location) => ({
      ...publicPart,
      active: booleanToString(publicPart.active),
      location,
      // TODO(#702): remove offer location backward compatibility
      // location V2 -> location
      locationV2: publicPart.location,
      locationState: convertLocationStateToOldVersion(publicPart),
      // TODO: remove offer locationState backward compatibility
      // locationState V2 -> locationState
      locationStateV2: publicPart.locationState,
    })),
    E.chainW(safeParse(OfferPublicPartToEncrypt)),
    E.chainW(stringifyToJson)
  )
}

export type ErrorEncryptingPublicPart = BasicError<'ErrorEncryptingPublicPart'>

export default function encryptOfferPublicPayload({
  offerPublicPart,
  symmetricKey,
}: {
  offerPublicPart: OfferPublicPart
  symmetricKey: SymmetricKey
}): TE.TaskEither<ErrorEncryptingPublicPart, PublicPayloadEncrypted> {
  return pipe(
    offerPublicPart,
    offerPublicPartToJsonString,
    TE.fromEither,
    TE.chainW(aesGCMIgnoreTagEncrypt(symmetricKey)),
    TE.map((encrypted) => `0${encrypted}`),
    TE.chainEitherKW(safeParse(PublicPayloadEncrypted)),
    TE.mapLeft(toError('ErrorEncryptingPublicPart'))
  )
}
