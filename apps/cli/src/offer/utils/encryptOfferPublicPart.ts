import {z} from 'zod'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type OfferPublicPart} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import {safeParse, stringifyToJson} from '../../utils/parsing'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {aesGCMIgnoreTagEncrypt} from '../../utils/crypto'

export const OfferPublicPartToEncrypt = z.object({
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
  active: z.coerce.string(),
  groupUuids: z.array(z.string()),
})
type OfferPublicPartToEncrypt = z.TypeOf<typeof OfferPublicPartToEncrypt>

function offerPublicPartToJsonString(publicPart: OfferPublicPart) {
  return pipe(
    publicPart.location,
    A.map(stringifyToJson),
    A.sequence(E.Applicative),
    E.map((location) => ({...publicPart, location})),
    E.chainW(safeParse(OfferPublicPartToEncrypt)),
    E.chainW(stringifyToJson)
  )
}

export default function encryptOfferPublicPart({
  offerPublicPart,
  symmetricKey,
}: {
  offerPublicPart: OfferPublicPart
  symmetricKey: string
}) {
  return pipe(
    offerPublicPart,
    offerPublicPartToJsonString,
    TE.fromEither,
    TE.chainW(aesGCMIgnoreTagEncrypt(symmetricKey)),
    TE.map((encrypted) => `0${encrypted}`)
  )
}
