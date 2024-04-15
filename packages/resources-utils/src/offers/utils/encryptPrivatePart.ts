import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PrivatePayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ServerPrivatePart} from '@vexl-next/rest-api/src/services/offer/contracts'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {eciesEncrypt} from '../../utils/crypto'
import {safeParse, stringifyToJson} from '../../utils/parsing'
import {type OfferPrivatePayloadToEncrypt} from './constructPrivatePayloads'

export type PrivatePartEncryptionError =
  BasicError<'PrivatePartEncryptionError'> & {toPublicKey: PublicKeyPemBase64}

export function encryptPrivatePart(
  privatePart: OfferPrivatePayloadToEncrypt
): TE.TaskEither<PrivatePartEncryptionError, ServerPrivatePart> {
  return pipe(
    TE.Do,
    TE.chainW(() => TE.fromEither(stringifyToJson(privatePart.payloadPrivate))),
    TE.chainW(
      flow(
        eciesEncrypt(privatePart.toPublicKey),
        TE.map((json) => `0${json}`),
        TE.chainEitherKW(safeParse(PrivatePayloadEncrypted))
      )
    ),
    TE.map((encrypted) => ({
      userPublicKey: privatePart.toPublicKey,
      payloadPrivate: encrypted,
    })),
    TE.mapLeft(
      (e) =>
        ({
          _tag: 'PrivatePartEncryptionError',
          error: new Error('Error encrypting private part', {cause: e?.error}),
          toPublicKey: privatePart.toPublicKey,
        }) as const
    )
  )
}
