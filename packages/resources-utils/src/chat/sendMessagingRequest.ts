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
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  type FriendLevel,
  type GoldenAvatarType,
} from '@vexl-next/domain/src/general/offers'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  type ErrorSigningChallenge,
  type InvalidChallengeError,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {type ErrorGeneratingChallenge} from '@vexl-next/rest-api/src/services/utils/addChallengeToRequest2'
import {Effect, type ParseResult} from 'effect'
import {taskEitherToEffect} from '../effect-helpers/TaskEitherConverter'
import {callWithNotificationService} from '../notifications/callWithNotificationService'
import {type JsonStringifyError} from '../utils/parsing'
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
  commonFriends,
  friendLevel,
}: {
  text: string
  myNotificationCypher?: NotificationCypher
  lastReceivedNotificationCypher?: NotificationCypher
  senderPublicKey: PublicKeyPemBase64
  myVersion: SemverString
  goldenAvatarType?: GoldenAvatarType
  senderClubsUuids: readonly ClubUuid[]
  commonFriends?: readonly HashedPhoneNumber[]
  friendLevel?: readonly FriendLevel[]
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
    commonFriends,
    friendLevel,
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
  commonFriends,
  friendLevel,
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
  commonFriends?: readonly HashedPhoneNumber[]
  friendLevel?: readonly FriendLevel[]
}): Effect.Effect<
  ChatMessage,
  | ApiErrorRequestMessaging
  | InvalidChallengeError
  | ErrorGeneratingChallenge
  | ErrorSigningChallenge
  | CryptoError
  | JsonStringifyError
  | ParseResult.ParseError
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
      commonFriends,
      friendLevel,
    })

    const message = yield* _(
      taskEitherToEffect(messageToNetwork(toPublicKey)(requestChatMessage))
    )

    yield* _(
      callWithNotificationService(api.requestApprovalV2, {
        message,
        receiverPublicKey: toPublicKey,
        keyPair: fromKeypair,
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
