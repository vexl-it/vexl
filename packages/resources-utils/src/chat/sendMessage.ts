import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationPrivateApi} from '@vexl-next/rest-api/src/services/notification'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {callWithNotificationService} from '../notifications/callWithNotificationService'
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
  theirFcmCypher,
  notificationApi,
  otherSideVersion,
}: {
  api: ChatPrivateApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
  theirFcmCypher?: FcmCypher | undefined
  notificationApi: NotificationPrivateApi
  otherSideVersion: SemverString | undefined
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
      callWithNotificationService(api.sendMessage, {
        message: encryptedMessage,
        messagePreview: encryptedPreview,
        messageType: message.messageType,
        receiverPublicKey,
        keyPair: senderKeypair,
      })({
        fcmCypher: theirFcmCypher,
        otherSideVersion,
        notificationApi,
      })
    )
  )
}
