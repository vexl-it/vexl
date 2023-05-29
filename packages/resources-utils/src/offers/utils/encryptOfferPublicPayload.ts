import {z} from 'zod'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {safeParse, stringifyToJson} from '../../utils/parsing'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {aesGCMIgnoreTagEncrypt} from '../../utils/crypto'
import {
  type OfferPublicPart,
  PublicPayloadEncrypted,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import {booleanToString} from '../../utils/booleanString'

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
