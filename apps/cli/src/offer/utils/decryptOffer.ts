import {type ServerOffer} from '@vexl-next/rest-api/dist/services/offer/contracts'
import * as E from 'fp-ts/Either'
import {
  type JsonParseError,
  parseJson,
  safeParse,
  type ZodParseError,
} from '../../utils/parsing'
import {pipe} from 'fp-ts/function'
import {type KeyHolder} from '@vexl-next/cryptography'
import * as TE from 'fp-ts/TaskEither'
import {
  aesGCMIgnoreTagDecrypt,
  type CryptoError,
  eciesDecrypt,
} from '../../utils/crypto'
import {
  OfferInfo,
  OfferPrivatePart,
  OfferPublicPart,
} from '@vexl-next/domain/dist/general/offers'

export interface OfferParsingError {
  _tag: 'OfferParsingError'
  originalError: unknown
}

function decryptedPayloadsToOffer({
  serverOffer,
  privatePayload,
  publicPayload,
}: {
  serverOffer: ServerOffer
  privatePayload: OfferPrivatePart
  publicPayload: OfferPublicPart
}): E.Either<ZodParseError<OfferInfo> | OfferParsingError, OfferInfo> {
  return pipe(
    E.tryCatch(
      () => {
        return {
          id: serverOffer.id,
          offerId: serverOffer.offerId,
          privatePart: privatePayload,
          publicPart: publicPayload,
          createdAt: serverOffer.createdAt,
          modifiedAt: serverOffer.modifiedAt,
        }
      },
      (e) => {
        return {
          _tag: 'OfferParsingError',
          originalError: e,
        } as const
      }
    ),
    E.chainW(safeParse(OfferInfo))
  )
}

function decodeLocation(json: any): E.Either<JsonParseError, unknown> {
  return pipe(
    json,
    E.right,
    E.map((one) => one.location),
    E.chainW(parseJson),
    E.map((location) => ({...json, location}))
  )
}

export function decryptOffer(
  privateKey: KeyHolder.PrivateKeyHolder
): (
  flow: ServerOffer
) => TE.TaskEither<
  | CryptoError
  | JsonParseError
  | ZodParseError<OfferInfo | OfferPrivatePart | OfferPublicPart>
  | OfferParsingError,
  OfferInfo
> {
  return (serverOffer: ServerOffer) =>
    pipe(
      TE.right(serverOffer),
      TE.bindTo('serverOffer'),
      TE.bindW('privatePayload', ({serverOffer}) => {
        console.log('Server offer', serverOffer)
        return pipe(
          TE.right(serverOffer.privatePayload),
          TE.chainW(eciesDecrypt(privateKey.privateKeyPemBase64)),
          TE.chainEitherKW(parseJson),
          TE.chainEitherKW(safeParse(OfferPrivatePart))
        )
      }),
      TE.bindW('publicPayload', ({privatePayload, serverOffer}) => {
        return pipe(
          TE.right(serverOffer.publicPayload.substring(1)),
          TE.chainW(aesGCMIgnoreTagDecrypt(privatePayload.symmetricKey)),
          TE.chainEitherKW(parseJson),
          TE.chainEitherKW(decodeLocation),
          TE.chainEitherKW(safeParse(OfferPublicPart))
        )
      }),
      TE.chainEitherKW(decryptedPayloadsToOffer)
    )
}
