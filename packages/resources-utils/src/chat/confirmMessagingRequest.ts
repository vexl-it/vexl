import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'

import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  now,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, type ParseResult} from 'effect'
import {type JsonStringifyError} from '../utils/parsing'
import sendMessage, {type SendMessageApiErrors} from './sendMessage'
import {type ErrorEncryptingMessage} from './utils/chatCrypto'

function createApproveChatMessage({
  text,
  senderPublicKey,
  approve,
  myVersion,
  myVexlToken,
}: {
  text: string
  senderPublicKey: PublicKeyPemBase64
  approve: boolean
  myVersion: VersionString
  myVexlToken?: VexlNotificationToken
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: approve ? 'APPROVE_MESSAGING' : 'DISAPPROVE_MESSAGING',
    text,
    time: now(),
    myVersion,
    senderPublicKey,
    myVexlToken,
    senderClubsUuids: [],
    commonFriends: [],
    friendLevel: [],
  }
}

export type ApiConfirmMessagingRequest = SendMessageApiErrors

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
  myVexlToken,
  theirNotificationToken,
  notificationApi,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  api: ChatApi
  approve: boolean
  myVersion: VersionString
  myVexlToken?: VexlNotificationToken
  theirNotificationToken?: VexlNotificationToken | undefined
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
      myVexlToken,
    })

    const serverMessage = yield* _(
      sendMessage({
        api,
        receiverPublicKey: toPublicKey,
        message: approvedMessage,
        senderKeypair: fromKeypair,
        theirNotificationToken,
        notificationApi,
      })
    )

    return {
      message: approvedMessage,
      receivedByServerAt: serverMessage.receivedByServerAt,
    }
  })
}
