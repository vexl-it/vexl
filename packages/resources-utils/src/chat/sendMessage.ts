import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'
import {messagePreviewToNetwork} from './utils/messagePreviewIO'

export type SendMessageApiErrors = ExtractLeftTE<
  ReturnType<ChatPrivateApi['sendMessage']>
>

export default function sendMessage({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
}: {
  api: ChatPrivateApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
}): TE.TaskEither<
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
  | SendMessageApiErrors,
  ServerMessage
> {
  return pipe(
    message,
    messageToNetwork(receiverPublicKey),
    TE.bindTo('encryptedMessage'),
    TE.bindW('encryptedPreview', () =>
      messagePreviewToNetwork(receiverPublicKey)(message)
    ),
    TE.chainW(({encryptedMessage, encryptedPreview}) =>
      pipe(
        api.sendMessage({
          message: encryptedMessage,
          messagePreview: encryptedPreview,
          messageType: message.messageType,
          receiverPublicKey,
          keyPair: senderKeypair,
        })
      )
    )
  )
}
