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
      })
    )

    return {
      message: encryptedMessage,
      senderPublicKey: senderKeypair.publicKeyPemBase64,
    }
  })
}
