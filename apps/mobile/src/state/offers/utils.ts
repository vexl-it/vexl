import {type PrivateKey} from '@vexl-next/cryptography'
import {type ServerOffer} from '@vexl-next/rest-api/dist/services/offer/contracts'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {
  aesGCMIgnoreTagDecrypt,
  type CryptoError,
  eciesDecrypt,
  type JsonParseError,
  parseJson,
  safeParse,
  type ZodParseError,
} from '../../utils/fpUtils'
import {pipe} from 'fp-ts/function'
import {OfferInfo} from '@vexl-next/domain/dist/general/OfferInfo'

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
  privatePayload: any
  publicPayload: any
}): E.Either<ZodParseError<OfferInfo> | OfferParsingError, OfferInfo> {
  return pipe(
    E.tryCatch(
      () => {
        return {
          id: serverOffer.id,
          offerId: serverOffer.offerId,
          offerPublicKey: publicPayload.offerPublicKey,
          offerDescription: publicPayload.offerDescription,
          amountBottomLimit: Number(publicPayload.amountBottomLimit),
          amountTopLimit: Number(publicPayload.amountTopLimit),
          feeState: publicPayload.feeState,
          feeAmount: Number(publicPayload.feeAmount),
          locationState: publicPayload.locationState,
          location: JSON.parse(publicPayload.location),
          paymentMethod: publicPayload.paymentMethod,
          btcNetwork: publicPayload.btcNetwork,
          currency: publicPayload.currency,
          friendLevel: privatePayload.friendLevel,
          offerType: publicPayload.offerType,
          activePriceState: publicPayload.activePriceState,
          activePriceValue: Number(publicPayload.activePriceValue),
          activePriceCurrency: publicPayload.activePriceCurrency,
          active: publicPayload.active === 'true',
          commonFriends: privatePayload.commonFriends,
          groupUuids: publicPayload.groupUuids,
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

export function decryptOffer(
  privateKey: PrivateKey
): (
  flow: ServerOffer
) => TE.TaskEither<
  CryptoError | JsonParseError | ZodParseError<OfferInfo> | OfferParsingError,
  OfferInfo
> {
  return (serverOffer: ServerOffer) =>
    pipe(
      TE.right(serverOffer),
      TE.bindTo('serverOffer'),
      TE.bindW('privatePayload', ({serverOffer}) => {
        return pipe(
          eciesDecrypt({
            data: serverOffer.privatePayload,
            privateKey,
          }),
          TE.chainEitherKW(parseJson)
        )
      }),
      TE.bindW('publicPayload', ({privatePayload, serverOffer}) => {
        return pipe(
          aesGCMIgnoreTagDecrypt(
            serverOffer.publicPayload.substring(1),
            privatePayload.symmetricKey
          ),
          TE.chainEitherKW(parseJson)
        )
      }),
      TE.chainEitherKW(decryptedPayloadsToOffer)
    )
}
