import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ServerMessage,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {type JsonStringifyError, type ZodParseError} from '../../utils/parsing'
import {
  parseChatMessage,
  type ErrorParsingChatMessage,
  type ErrorChatMessageRequiresNewerVersion,
} from './parseChatMessage'
import serializeChatMessage from './serializeChatMessage'
import {
  type ErrorDecryptingMessage,
  type ErrorEncryptingMessage,
  decryptMessage,
  encryptMessage,
} from './chatCrypto'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'

export function messageToNetwork(
  receiverPublicKey: PublicKeyPemBase64
): (
  message: ChatMessage
) => TE.TaskEither<
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
  string
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
