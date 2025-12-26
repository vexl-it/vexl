import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  MessageCypher,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Schema} from 'effect/index'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {eciesDecrypt, eciesEncrypt} from '../../utils/crypto'

export class ErrorEncryptingMessage extends Schema.TaggedError<ErrorEncryptingMessage>(
  'ErrorEncryptingMessage'
)('ErrorEncryptingMessage', {
  cause: Schema.Unknown,
}) {}

export function encryptMessage(
  publicKey: PublicKeyPemBase64
): (
  messageString: string
) => TE.TaskEither<ErrorEncryptingMessage, MessageCypher> {
  return flow(
    eciesEncrypt(publicKey),
    TE.map(Schema.decodeSync(MessageCypher)),
    TE.mapLeft((e) => new ErrorEncryptingMessage({cause: e}))
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
