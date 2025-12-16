import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ChatMessagePayload,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {callWithNotificationService} from '../notifications/callWithNotificationService'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'
import {messagePreviewToNetwork} from './utils/messagePreviewIO'

// Handled like this to get linter error when new type is added
type HANDLED_MESSAGE_TYPES =
  | 'APPROVE_CONTACT_REVEAL'
  | 'APPROVE_MESSAGING'
  | 'APPROVE_REVEAL'
  | 'BLOCK_CHAT'
  | 'CANCEL_REQUEST_MESSAGING'
  | 'DELETE_CHAT'
  | 'DISAPPROVE_CONTACT_REVEAL'
  | 'DISAPPROVE_MESSAGING'
  | 'DISAPPROVE_REVEAL'
  | 'INBOX_DELETED'
  | 'MESSAGE'
  | 'OFFER_DELETED'
  | 'REQUEST_CONTACT_REVEAL'
  | 'REQUEST_MESSAGING'
  | 'REQUEST_REVEAL'
  | 'TRADE_CHECKLIST_UPDATE'
  | 'FCM_CYPHER_UPDATE'
  | 'VERSION_UPDATE'
  | 'MESSAGE_READ'

const sendSystemNotification = (
  messageType: HANDLED_MESSAGE_TYPES
): boolean => {
  if (
    messageType === 'FCM_CYPHER_UPDATE' ||
    messageType === 'VERSION_UPDATE' ||
    messageType === 'MESSAGE_READ'
  )
    return false

  return true
}

export type SendMessageApiErrors = Effect.Effect.Error<
  ReturnType<ChatApi['sendMessage']>
>

export default function sendMessage({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
  theirNotificationCypher,
  notificationApi,
  otherSideVersion,
}: {
  api: ChatApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
  theirNotificationCypher?: NotificationCypher | undefined
  notificationApi: NotificationApi
  otherSideVersion: SemverString | undefined
}): Effect.Effect<
  ServerMessage,
  | ErrorEncryptingMessage
  | SendMessageApiErrors
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
> {
  return Effect.gen(function* (_) {
    const encryptedMessage = yield* _(
      taskEitherToEffect(messageToNetwork(receiverPublicKey)(message))
    )
    const encryptedPreview = yield* _(
      taskEitherToEffect(messagePreviewToNetwork(receiverPublicKey)(message))
    )

    yield* _(
      callWithNotificationService(api.sendMessage, {
        message: encryptedMessage,
        messagePreview: encryptedPreview,
        messageType: message.messageType,
        receiverPublicKey,
        senderPublicKey: senderKeypair.publicKeyPemBase64,
        keyPair: senderKeypair,
      })({
        notificationCypher: theirNotificationCypher,
        otherSideVersion,
        notificationApi,
        sendSystemNotification: sendSystemNotification(message.messageType),
      })
    )

    return {
      message: encryptedMessage,
      senderPublicKey: senderKeypair.publicKeyPemBase64,
    }
  })
}
