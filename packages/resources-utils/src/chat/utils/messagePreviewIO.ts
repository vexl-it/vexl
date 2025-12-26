import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {toError} from '@vexl-next/domain/src/utility/errors'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import truncate from 'just-truncate'
import {eciesDecrypt, eciesEncrypt} from '../../utils/crypto'
import {ErrorEncryptingMessage, type ErrorDecryptingMessage} from './chatCrypto'

export function messagePreviewToNetwork(
  publicKey: PublicKeyPemBase64
): (
  message: ChatMessage
) => TE.TaskEither<ErrorEncryptingMessage, string | undefined> {
  return (message: ChatMessage) => {
    if (message.messageType !== 'MESSAGE') return TE.right(undefined)
    return pipe(
      TE.right(truncate(message.text, 250)),
      TE.chainW(eciesEncrypt(publicKey)),
      TE.mapLeft((e) => new ErrorEncryptingMessage({cause: e}))
    )
  }
}

export function messagePreviewFromNetwork(
  privKey: PrivateKeyPemBase64
): (message: string) => TE.TaskEither<ErrorDecryptingMessage, string> {
  return (message) => {
    return pipe(
      eciesDecrypt(privKey)(message),
      TE.mapLeft(toError('ErrorDecryptingMessage'))
    )
  }
}
