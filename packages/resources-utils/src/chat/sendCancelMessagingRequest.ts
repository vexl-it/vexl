import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  now,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, type ParseResult} from 'effect'
import {type NotificationTokenOrCypher} from '../notifications/callWithNotificationService'
import {type JsonStringifyError} from '../utils/parsing'
import sendMessage, {type SendMessageApiErrors} from './sendMessage'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'

function createCancelRequestChatMessage({
  text,
  senderPublicKey,
  myVersion,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    myVersion,
    messageType: 'CANCEL_REQUEST_MESSAGING',
    text,
    time: now(),
    senderPublicKey,
    senderClubsUuids: [],
    commonFriends: [],
    friendLevel: [],
  }
}

export type ApiErrorRequestMessaging = SendMessageApiErrors

export interface SentCancelMessagingRequest {
  message: ChatMessage
  receivedByServerAt?: UnixMilliseconds
}

export function sendCancelMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
  myVersion,
  theirNotificationCypher,
  otherSideVersion,
  notificationApi,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatApi
  myVersion: VersionString
  theirNotificationCypher?: NotificationTokenOrCypher | undefined
  otherSideVersion: VersionString | undefined
  notificationApi: NotificationApi
}): Effect.Effect<
  SentCancelMessagingRequest,
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ParseResult.ParseError
  | ErrorEncryptingMessage
> {
  return Effect.gen(function* (_) {
    const cancelRequestMessage = createCancelRequestChatMessage({
      text,
      myVersion,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    })

    const serverMessage = yield* _(
      sendMessage({
        api,
        receiverPublicKey: toPublicKey,
        message: cancelRequestMessage,
        senderKeypair: fromKeypair,
        theirNotificationCypher,
        otherSideVersion,
        notificationApi,
      })
    )

    return {
      message: cancelRequestMessage,
      receivedByServerAt: serverMessage.receivedByServerAt,
    }
  })
}
