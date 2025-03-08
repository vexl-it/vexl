import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'

import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {callWithNotificationService} from '../notifications/callWithNotificationService'
import {type JsonStringifyError, type ZodParseError} from '../utils/parsing'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'
import {messageToNetwork} from './utils/messageIO'

function createApproveChatMessage({
  text,
  senderPublicKey,
  approve,
  myVersion,
  myNotificationCypher,
  lastReceivedNotificationCypher,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
  approve: boolean
  myVersion: SemverString
  myNotificationCypher?: NotificationCypher
  lastReceivedNotificationCypher?: NotificationCypher
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: approve ? 'APPROVE_MESSAGING' : 'DISAPPROVE_MESSAGING',
    text,
    time: now(),
    myVersion,
    senderPublicKey,
    myFcmCypher: myNotificationCypher,
    lastReceivedFcmCypher: lastReceivedNotificationCypher,
  }
}

export type ApiConfirmMessagingRequest = Effect.Effect.Error<
  ReturnType<ChatApi['approveRequest']>
>

export default function confirmMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
  approve,
  myVersion,
  myNotificationCypher,
  lastReceivedNotificationCypher,
  theirNotificationCypher,
  otherSideVersion,
  notificationApi,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatApi
  approve: boolean
  myVersion: SemverString
  myNotificationCypher?: NotificationCypher
  lastReceivedNotificationCypher?: NotificationCypher
  theirNotificationCypher?: NotificationCypher | undefined
  otherSideVersion: SemverString | undefined
  notificationApi: NotificationApi
}): Effect.Effect<
  ChatMessage,
  | ApiConfirmMessagingRequest
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
> {
  return Effect.gen(function* (_) {
    const approvedMessage = createApproveChatMessage({
      text,
      myVersion,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
      approve,
      myNotificationCypher,
      lastReceivedNotificationCypher,
    })

    const message = yield* _(
      taskEitherToEffect(messageToNetwork(toPublicKey)(approvedMessage))
    )

    yield* _(
      callWithNotificationService(api.approveRequest, {
        message,
        approve,
        keyPair: fromKeypair,
        publicKeyToConfirm: toPublicKey,
      })({
        notificationCypher: theirNotificationCypher,
        otherSideVersion,
        notificationApi,
      })
    )

    return approvedMessage
  })
}
