import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
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
  myFcmCypher,
  lastReceivedFcmCypher,
  myVersion,
}: {
  text: string
  myFcmCypher?: FcmCypher
  lastReceivedFcmCypher?: FcmCypher
  senderPublicKey: PublicKeyPemBase64
  myVersion: SemverString
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_MESSAGING',
    text,
    myFcmCypher,
    lastReceivedFcmCypher,
    time: now(),
    myVersion,
    senderPublicKey,
  }
}

export type ApiErrorRequestMessaging = Effect.Effect.Error<
  ReturnType<ChatApi['requestApproval']>
>

export function sendMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  myFcmCypher,
  lastReceivedFcmCypher,
  api,
  myVersion,
  theirFcmCypher,
  notificationApi,
  otherSideVersion,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  myFcmCypher?: FcmCypher
  lastReceivedFcmCypher?: FcmCypher
  api: ChatApi
  myVersion: SemverString
  theirFcmCypher?: FcmCypher | undefined
  notificationApi: NotificationApi
  otherSideVersion?: SemverString | undefined
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
      myFcmCypher,
      lastReceivedFcmCypher,
    })

    const message = yield* _(
      taskEitherToEffect(messageToNetwork(toPublicKey)(requestChatMessage))
    )

    yield* _(
      callWithNotificationService(api.requestApproval, {
        message,
        publicKey: toPublicKey,
      })({
        fcmCypher: theirFcmCypher,
        otherSideVersion,
        notificationApi,
      })
    )

    return requestChatMessage
  })
}
