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

function createMessagingRequestNotification({
  inbox,
  sender,
}: {
  inbox: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): ChatNotificationData {
  return new ChatNotificationData({
    version: '1',
    type: 'REQUEST_MESSAGING',
    sender,
    inbox,
  })
}

export type ApiErrorRequestMessaging = ExtractLeftTE<
  ReturnType<ChatPrivateApi['requestApproval']>
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
  api: ChatPrivateApi
  myVersion: SemverString
  theirFcmCypher?: FcmCypher | undefined
  notificationApi: NotificationPrivateApi
  otherSideVersion?: SemverString | undefined
}): TE.TaskEither<
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ZodParseError<ChatMessagePayload>
  | ErrorEncryptingMessage,
  ChatMessage
> {
  return pipe(
    createRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
      myVersion,
      myFcmCypher,
      lastReceivedFcmCypher,
    }),
    TE.right,
    TE.chainFirstW(
      flow(
        messageToNetwork(toPublicKey),
        TE.chainW((message) =>
          callWithNotificationService(api.requestApproval, {
            message,
            publicKey: toPublicKey,
          })({
            notificationToSend: createMessagingRequestNotification({
              inbox: toPublicKey,
              sender: fromKeypair.publicKeyPemBase64,
            }),
            fcmCypher: theirFcmCypher,
            otherSideVersion,
            notificationApi,
          })
        )
      )
    )
  )
}
