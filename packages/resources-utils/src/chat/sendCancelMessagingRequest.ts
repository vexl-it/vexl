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

function createCancelRequestChatMessage({
  text,
  senderPublicKey,
  myVersion,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
  myVersion: SemverString
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    myVersion,
    messageType: 'CANCEL_REQUEST_MESSAGING',
    text,
    time: now(),
    senderPublicKey,
  }
}

export type ApiErrorRequestMessaging = Effect.Effect.Error<
  ReturnType<ChatApi['cancelRequestApproval']>
>

export function sendCancelMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  api,
  myVersion,
  theirFcmCypher,
  otherSideVersion,
  notificationApi,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatApi
  myVersion: SemverString
  theirFcmCypher?: FcmCypher | undefined
  otherSideVersion: SemverString | undefined
  notificationApi: NotificationApi
}): Effect.Effect<
  ChatMessage,
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage
> {
  return Effect.gen(function* (_) {
    const cancelRequestMessage = createCancelRequestChatMessage({
      text,
      myVersion,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    })

    const message = yield* _(
      taskEitherToEffect(messageToNetwork(toPublicKey)(cancelRequestMessage))
    )

    yield* _(
      callWithNotificationService(api.cancelRequestApproval, {
        message,
        publicKey: toPublicKey,
      })({
        otherSideVersion,
        fcmCypher: theirFcmCypher,
        notificationApi,
      })
    )

    return cancelRequestMessage
  })
}
