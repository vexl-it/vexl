import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  OfferLocation,
  PublicPayloadEncrypted,
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

const OfferLocationDepreciated = z.object({
  longitude: z.string(),
  latitude: z.string(),
  city: z.string(),
})
type OfferLocationDepreciated = z.TypeOf<typeof OfferLocationDepreciated>

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
  locationState: z.string(),
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
})

// TODO unit test
function offerPublicPartToJsonString(
  publicPart: OfferPublicPart
): E.Either<unknown, string> {
  return pipe(
    publicPart.location,
    A.map(
      (oneLocation) =>
        ({
          longitude: oneLocation.longitude,
          latitude: oneLocation.latitude,
          city: oneLocation.shortAddress,
        }) satisfies OfferLocationDepreciated
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
