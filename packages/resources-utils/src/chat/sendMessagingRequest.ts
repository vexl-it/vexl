import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
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

function createRequestChatMessage({
  text,
  senderPublicKey,
  myNotificationCypher,
  lastReceivedNotificationCypher,
  myVersion,
  goldenAvatarType,
  senderClubsUuids,
}: {
  text: string
  myNotificationCypher?: NotificationCypher
  lastReceivedNotificationCypher?: NotificationCypher
  senderPublicKey: PublicKeyPemBase64
  myVersion: SemverString
  goldenAvatarType?: GoldenAvatarType
  senderClubsUuids: readonly ClubUuid[]
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_MESSAGING',
    text,
    myFcmCypher: myNotificationCypher,
    lastReceivedFcmCypher: lastReceivedNotificationCypher,
    time: now(),
    myVersion,
    senderPublicKey,
    goldenAvatarType,
    senderClubsUuids,
  }
}

export type ApiErrorRequestMessaging = Effect.Effect.Error<
  ReturnType<ChatApi['requestApproval']>
>

export function sendMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  myNotificationCypher,
  lastReceivedNotificationCypher,
  api,
  myVersion,
  theirNotificationCypher,
  notificationApi,
  otherSideVersion,
  goldenAvatarType,
  forClubsUuids,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  myNotificationCypher?: NotificationCypher
  lastReceivedNotificationCypher?: NotificationCypher
  api: ChatApi
  myVersion: SemverString
  theirNotificationCypher?: NotificationCypher | undefined
  notificationApi: NotificationApi
  otherSideVersion?: SemverString | undefined
  goldenAvatarType?: GoldenAvatarType
  forClubsUuids: readonly ClubUuid[]
}): Effect.Effect<
  ChatMessage,
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
> {
  return Effect.gen(function* (_) {
    const requestChatMessage = createRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
      myVersion,
      myNotificationCypher,
      lastReceivedNotificationCypher,
      goldenAvatarType,
      senderClubsUuids: forClubsUuids,
    })

    const message = yield* _(
      taskEitherToEffect(messageToNetwork(toPublicKey)(requestChatMessage))
    )

    yield* _(
      callWithNotificationService(api.requestApproval, {
        message,
        publicKey: toPublicKey,
      })({
        notificationCypher: theirNotificationCypher,
        otherSideVersion,
        notificationApi,
        sendSystemNotification: true,
      })
    )

    return requestChatMessage
  })
}
