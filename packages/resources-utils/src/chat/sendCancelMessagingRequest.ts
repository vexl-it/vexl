import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {
  ChatNotificationData,
  type FcmCypher,
} from '@vexl-next/domain/src/general/notifications'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationPrivateApi} from '@vexl-next/rest-api/src/services/notification'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {callWithNotificationService} from '../notifications/callWithNotificationService'
import {type ExtractLeftTE} from '../utils/ExtractLeft'
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

function createCancelChatNotification({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): ChatNotificationData {
  return new ChatNotificationData({
    version: '2',
    type: 'CANCEL_REQUEST_MESSAGING',
    sender,
    inbox,
  })
}

export type ApiErrorRequestMessaging = ExtractLeftTE<
  ReturnType<ChatPrivateApi['cancelRequestApproval']>
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
  api: ChatPrivateApi
  myVersion: SemverString
  theirFcmCypher?: FcmCypher | undefined
  otherSideVersion: SemverString | undefined
  notificationApi: NotificationPrivateApi
}): TE.TaskEither<
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
  ChatMessage
> {
  return pipe(
    createCancelRequestChatMessage({
      text,
      myVersion,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        messageToNetwork(toPublicKey),
        TE.chainW((message) =>
          callWithNotificationService(api.cancelRequestApproval, {
            message,
            publicKey: toPublicKey,
          })({
            notificationToSend: createCancelChatNotification({
              inbox: toPublicKey,
              sender: fromKeypair.publicKeyPemBase64,
            }),
            otherSideVersion,
            fcmCypher: theirFcmCypher,
            notificationApi,
          })
        )
      )
    )
  )
}
