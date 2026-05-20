import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'

import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {
  now,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, type ParseResult} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {
  callWithNotificationService,
  type NotificationTokenOrCypher,
} from '../notifications/callWithNotificationService'
import {type JsonStringifyError} from '../utils/parsing'
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
  myNotificationCypher?: NotificationTokenOrCypher
  lastReceivedNotificationCypher?: NotificationTokenOrCypher
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: approve ? 'APPROVE_MESSAGING' : 'DISAPPROVE_MESSAGING',
    text,
    time: now(),
    myVersion,
    senderPublicKey,
    // TODO #2124
    myFcmCypher: myNotificationCypher,
    myVexlToken:
      myNotificationCypher && isVexlNotificationToken(myNotificationCypher)
        ? myNotificationCypher
        : undefined,
    lastReceivedFcmCypher: lastReceivedNotificationCypher,
    senderClubsUuids: [],
    commonFriends: [],
    friendLevel: [],
  }
}

export type ApiConfirmMessagingRequest = Effect.Effect.Error<
  ReturnType<ChatApi['approveRequest']>
>

export interface SentConfirmMessagingRequest {
  message: ChatMessage
  receivedByServerAt?: UnixMilliseconds
}

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
  myNotificationCypher?: NotificationTokenOrCypher
  lastReceivedNotificationCypher?: NotificationTokenOrCypher
  theirNotificationCypher?: NotificationTokenOrCypher | undefined
  otherSideVersion: SemverString | undefined
  notificationApi: NotificationApi
}): Effect.Effect<
  SentConfirmMessagingRequest,
  | ApiConfirmMessagingRequest
  | JsonStringifyError
  | ParseResult.ParseError
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

    const serverMessage = yield* _(
      callWithNotificationService(api.approveRequest, {
        message,
        approve,
        keyPair: fromKeypair,
        publicKeyToConfirm: toPublicKey,
      })({
        notificationCypher: theirNotificationCypher,
        otherSideVersion,
        notificationApi,
        sendSystemNotification: true,
      })
    )

    return {
      message: approvedMessage,
      receivedByServerAt: serverMessage.receivedByServerAt,
    }
  })
}
