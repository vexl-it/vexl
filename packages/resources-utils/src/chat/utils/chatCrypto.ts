import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {toError, type BasicError} from '@vexl-next/domain/dist/utility/errors'
import {type ServerMessage} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {eciesDecrypt, eciesEncrypt} from '../../utils/crypto'

export type ErrorEncryptingMessage = BasicError<'ErrorEncryptingMessage'>

export function encryptMessage(
  publicKey: PublicKeyPemBase64
): (messageString: string) => TE.TaskEither<ErrorEncryptingMessage, string> {
  return flow(
    eciesEncrypt(publicKey),
    TE.mapLeft(toError('ErrorEncryptingMessage'))
  )
}

export type ErrorDecryptingMessage = BasicError<'ErrorDecryptingMessage'>

export function decryptMessage(
  privateKey: PrivateKeyHolder
): (message: ServerMessage) => TE.TaskEither<ErrorDecryptingMessage, string> {
  return (message: ServerMessage) =>
    pipe(
      eciesDecrypt(privateKey.privateKeyPemBase64)(message.message),
      TE.mapLeft(toError('ErrorDecryptingMessage'))
    )
}
