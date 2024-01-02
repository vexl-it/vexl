import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import {
  type ChatMessagePayload,
  type ChatMessage,
  type ServerMessage,
} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
import mapMessageTypeToBackwardCompatibleMessageType from './utils/mapMessageTypeToBackwardCompatibleMessageType'
import {messageToNetwork} from './utils/messageIO'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
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
          messageType: mapMessageTypeToBackwardCompatibleMessageType(
            message.messageType
          ),
          receiverPublicKey,
          keyPair: senderKeypair,
        })
      )
    )
  )
}
