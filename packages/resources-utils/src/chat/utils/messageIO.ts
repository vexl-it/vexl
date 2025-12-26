import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type MessageCypher,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type ParseResult} from 'effect/index'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type JsonStringifyError} from '../../utils/parsing'
import {
  decryptMessage,
  encryptMessage,
  type ErrorDecryptingMessage,
  type ErrorEncryptingMessage,
} from './chatCrypto'
import {
  parseChatMessage,
  type ErrorChatMessageRequiresNewerVersion,
  type ErrorParsingChatMessage,
} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'

export function messageToNetwork(
  receiverPublicKey: PublicKeyPemBase64
): (
  message: ChatMessage
) => TE.TaskEither<
  JsonStringifyError | ParseResult.ParseError | ErrorEncryptingMessage,
  MessageCypher
> {
  return flow(
    serializeChatMessage,
    TE.fromEither,
    TE.chainW(encryptMessage(receiverPublicKey))
  )
}

export function messageFromNetwork({
  privateKey,
  appVersion,
}: {
  privateKey: PrivateKeyHolder
  appVersion: SemverString
}): (
  serverMessage: ServerMessage
) => TE.TaskEither<
  | ErrorDecryptingMessage
  | ErrorParsingChatMessage
  | ErrorChatMessageRequiresNewerVersion,
  ChatMessage
> {
  return (serverMessage) =>
    pipe(
      decryptMessage(privateKey)(serverMessage),
      TE.chainEitherKW((message) =>
        parseChatMessage({appVersion, serverMessage})(message)
      )
    )
}
