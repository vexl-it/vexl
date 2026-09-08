import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type ChatMessage,
  type ServerMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, type Schema} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {
  callWithNotificationService,
  type NotificationTokenOrCypher,
} from '../notifications/callWithNotificationService'
import {type JsonStringifyError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'

export type SendMessageApiErrors = Effect.Error<
  ReturnType<ChatApi['sendMessage']>
>

export default function sendLeaveChat({
  api,
  receiverPublicKey,
  message,
  senderKeypair,
  theirNotificationCypher,
  otherSideVersion,
  notificationApi,
}: {
  api: ChatApi
  receiverPublicKey: PublicKeyPemBase64
  message: ChatMessage
  senderKeypair: PrivateKeyHolder
  theirNotificationCypher?: NotificationTokenOrCypher | undefined
  otherSideVersion: VersionString | undefined
  notificationApi: NotificationApi
}): Effect.Effect<
  ServerMessage,
  | Schema.SchemaError
  | JsonStringifyError
  | ErrorEncryptingMessage
  | SendMessageApiErrors
> {
  return Effect.gen(function* () {
    const encryptedMessage = yield* taskEitherToEffect(
      messageToNetwork(receiverPublicKey)(message)
    )

    const serverMessage = yield* callWithNotificationService(api.leaveChat, {
      message: encryptedMessage,
      receiverPublicKey,
      senderPublicKey: senderKeypair.publicKeyPemBase64,
      keyPair: senderKeypair,
    })({
      notificationApi,
      notificationCypher: theirNotificationCypher,
      otherSideVersion,
      sendSystemNotification: true,
    })

    return {
      message: encryptedMessage,
      senderPublicKey: senderKeypair.publicKeyPemBase64,
      receivedByServerAt: serverMessage.receivedByServerAt,
    }
  })
}
