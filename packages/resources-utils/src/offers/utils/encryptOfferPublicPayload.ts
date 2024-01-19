import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
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

const OfferPublicPartToEncrypt = z.object({
  offerPublicKey: PublicKeyPemBase64,
  location: z.array(z.string()),
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

function offerPublicPartToJsonString(
  publicPart: OfferPublicPart
): E.Either<unknown, string> {
  return pipe(
    publicPart.location,
    A.map(stringifyToJson),
    A.sequence(E.Applicative),
    E.map((location) => ({
      ...publicPart,
      active: booleanToString(publicPart.active),
      location,
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
