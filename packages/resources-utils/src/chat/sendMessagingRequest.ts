import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  type FriendLevel,
  type GoldenAvatarType,
} from '@vexl-next/domain/src/general/offers'
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

function createRequestChatMessage({
  text,
  senderPublicKey,
  myVexlToken,
  myVersion,
  goldenAvatarType,
  senderClubsUuids,
  commonFriends,
  verifiedCommonFriends,
  friendLevel,
}: {
  text: string
  myVexlToken?: VexlNotificationToken
  senderPublicKey: PublicKeyPemBase64
  myVersion: VersionString
  goldenAvatarType?: GoldenAvatarType
  senderClubsUuids: readonly ClubUuid[]
  commonFriends?: readonly HashedPhoneNumber[]
  verifiedCommonFriends?: readonly HashedPhoneNumber[]
  friendLevel?: readonly FriendLevel[]
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    messageType: 'REQUEST_MESSAGING',
    text,
    myVexlToken,
    time: now(),
    myVersion,
    senderPublicKey,
    goldenAvatarType,
    senderClubsUuids,
    commonFriends,
    verifiedCommonFriends,
    friendLevel,
  }
}

export type ApiErrorRequestMessaging = SendMessageApiErrors

export interface SentMessagingRequest {
  message: ChatMessage
  receivedByServerAt?: UnixMilliseconds
}

export function sendMessagingRequest({
  text,
  fromKeypair,
  toPublicKey,
  myVexlToken,
  api,
  myVersion,
  theirNotificationToken,
  notificationApi,
  goldenAvatarType,
  forClubsUuids,
  commonFriends,
  verifiedCommonFriends,
  friendLevel,
}: {
  text: string
  fromKeypair: PrivateKeyHolder
  toPublicKey: PublicKeyPemBase64
  myVexlToken?: VexlNotificationToken
  api: ChatApi
  myVersion: VersionString
  theirNotificationToken?: VexlNotificationToken | undefined
  notificationApi: NotificationApi
  goldenAvatarType?: GoldenAvatarType
  forClubsUuids: readonly ClubUuid[]
  commonFriends?: readonly HashedPhoneNumber[]
  verifiedCommonFriends?: readonly HashedPhoneNumber[]
  friendLevel?: readonly FriendLevel[]
}): Effect.Effect<
  SentMessagingRequest,
  | ApiErrorRequestMessaging
  | JsonStringifyError
  | ParseResult.ParseError
  | ErrorEncryptingMessage
> {
  return Effect.gen(function* (_) {
    const requestChatMessage = createRequestChatMessage({
      text,
      senderPublicKey: fromKeypair.publicKeyPemBase64,
      myVersion,
      myVexlToken,
      goldenAvatarType,
      senderClubsUuids: forClubsUuids,
      commonFriends,
      verifiedCommonFriends,
      friendLevel,
    })

    const serverMessage = yield* _(
      sendMessage({
        api,
        receiverPublicKey: toPublicKey,
        message: requestChatMessage,
        senderKeypair: fromKeypair,
        theirNotificationToken,
        notificationApi,
      })
    )

    return {
      message: requestChatMessage,
      receivedByServerAt: serverMessage.receivedByServerAt,
    }
  })
}
