import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  ChatNotificationData,
  type FcmCypher,
} from '@vexl-next/domain/src/general/notifications'
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

export type SendMessageApiErrors = ExtractLeftTE<
  ReturnType<ChatPrivateApi['sendMessage']>
>

function createLeaveChatNotification({
  inbox,
  sender,
  approve,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
  approve: boolean
}): ChatNotificationData {
  return new ChatNotificationData({
    version: '2',
    type: 'DELETE_CHAT',
    sender,
    inbox,
  })
}

export default function sendLeaveChat({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
  theirFcmCypher,
  otherSideVersion,
  notificationApi,
}: {
  api: ChatPrivateApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
  theirFcmCypher?: FcmCypher | undefined
  otherSideVersion: SemverString | undefined
  notificationApi: NotificationPrivateApi
}): TE.TaskEither<
  | ZodParseError<ChatMessagePayload>
  | JsonStringifyError
  | ErrorEncryptingMessage
  | SendMessageApiErrors,
  ServerMessage
> {
  return pipe(
    message,
    messageToNetwork(receiverPublicKey),
    TE.chainW((encrypted) =>
      callWithNotificationService(api.leaveChat, {
        message: encrypted,
        receiverPublicKey,
        keyPair: senderKeypair,
      })({
        notificationToSend: createLeaveChatNotification({
          inbox: receiverPublicKey,
          sender: senderKeypair.publicKeyPemBase64,
          approve: false,
        }),
        notificationApi,
        fcmCypher: theirFcmCypher,
        otherSideVersion,
      })
    )
  )
}
