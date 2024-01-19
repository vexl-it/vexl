import {type KeyHolder} from '@vexl-next/cryptography'
import {
  OfferInfo,
  OfferPrivatePart,
  OfferPublicPart,
} from '@vexl-next/domain/src/general/offers'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {stringToBoolean} from '../utils/booleanString'
import {aesGCMIgnoreTagDecrypt, eciesDecrypt} from '../utils/crypto'
import {
  parseJson,
  safeParse,
  type JsonParseError,
  type ZodParseError,
} from '../utils/parsing'

export interface ErrorDecryptingOffer
  extends BasicError<'ErrorDecryptingOffer'> {
  serverOffer: ServerOffer
}

export interface NonCompatibleOfferVersionError {
  _tag: 'NonCompatibleOfferVersionError'
}

function decryptedPayloadsToOffer({
  serverOffer,
  privatePayload,
  publicPayload,
}: {
  serverOffer: ServerOffer
  privatePayload: OfferPrivatePart
  publicPayload: OfferPublicPart
}): E.Either<ZodParseError<OfferInfo>, OfferInfo> {
  return pipe(
    E.right({
      id: serverOffer.id,
      offerId: serverOffer.offerId,
      privatePart: privatePayload,
      publicPart: publicPayload,
      createdAt: serverOffer.createdAt,
      modifiedAt: serverOffer.modifiedAt,
    }),
    E.chainW(safeParse(OfferInfo))
  )
}

function decodeLocation(json: any): E.Either<JsonParseError, unknown> {
  return pipe(
    json,
    E.right,
    E.map((one) => one.location),
    E.chainW(flow(A.map(parseJson), A.sequence(E.Applicative))),
    E.map((location) => ({...json, location}))
  )
}

export default function decryptOffer(
  privateKey: KeyHolder.PrivateKeyHolder
): (
  serverOffer: ServerOffer
) => TE.TaskEither<
  ErrorDecryptingOffer | NonCompatibleOfferVersionError,
  OfferInfo
> {
  return (serverOffer: ServerOffer) => {
    if (
      serverOffer.publicPayload.at(0) !== '0' ||
      serverOffer.privatePayload.at(0) !== '0'
    ) {
      return TE.left({
        _tag: 'NonCompatibleOfferVersionError',
      })
    }

    return pipe(
      TE.right(serverOffer),
      TE.bindTo('serverOffer'),
      TE.bindW('privatePayload', ({serverOffer}) => {
        return pipe(
          TE.right(serverOffer.privatePayload.substring(1)),
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
          TE.map((one) => ({
            ...one,
            active: stringToBoolean(one.active),
          })),
          TE.chainEitherKW(decodeLocation),
          TE.chainEitherKW(safeParse(OfferPublicPart))
        )
      }),
      TE.chainEitherKW(decryptedPayloadsToOffer),
      TE.mapLeft((error) => ({
        ...toError(
          'ErrorDecryptingOffer',
          'Error while decrypting offer'
        )(error),
        serverOffer,
      }))
    )
  }
}
