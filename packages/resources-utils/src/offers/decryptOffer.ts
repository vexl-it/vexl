import {type KeyHolder} from '@vexl-next/cryptography'
import {type ServerOffer} from '@vexl-next/rest-api/dist/services/offer/contracts'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type BasicError, toError} from '@vexl-next/domain/dist/utility/errors'
import {
  OfferInfo,
  OfferPrivatePart,
  OfferPublicPart,
} from '@vexl-next/domain/dist/general/offers'
import {aesGCMIgnoreTagDecrypt, eciesDecrypt} from '../utils/crypto'
import {
  type JsonParseError,
  parseJson,
  safeParse,
  type ZodParseError,
} from '../utils/parsing'
import * as E from 'fp-ts/Either'
import * as A from 'fp-ts/Array'
import {stringToBoolean} from '../utils/booleanString'

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
          TE.map((one) => ({...one, active: stringToBoolean(one.active)})),
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
