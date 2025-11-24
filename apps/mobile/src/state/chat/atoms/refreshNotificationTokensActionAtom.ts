import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
  type MyNotificationTokenInfo,
} from '@vexl-next/domain/src/general/messaging'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import reportError from '../../../utils/reportError'
import {type ChatWithMessages} from '../domain'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import {
  generateMyNotificationTokenInfoActionAtom,
  updateMyNotificationTokenInfoInChat,
} from './generateMyNotificationTokenInfoActionAtom'

const FCM_TOKEN_UPDATE_MESSAGE_MINIMAL_VERSION = SemverString.parse('1.13.1')

function createFcmCypherUpdateMessage(
  senderPublicKey: PublicKeyPemBase64,
  info?: MyNotificationTokenInfo,
  lastReceivedFcmCypher?: NotificationCypher
): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    myFcmCypher: info?.cypher,
    time: now(),
    myVersion: version,
    lastReceivedFcmCypher,
    messageType: 'FCM_CYPHER_UPDATE',
    minimalRequiredVersion: FCM_TOKEN_UPDATE_MESSAGE_MINIMAL_VERSION,
    senderPublicKey,
    text: '',
  }
}

export const sendFcmCypherUpdateMessageActionAtom = atom(
  null,
  (
    get,
    set,
    notificationToken?: ExpoNotificationToken
  ): ((chatWithMessages: ChatWithMessages) => Effect.Effect<boolean>) => {
    return (chatWithMessages) => {
      return Effect.gen(function* (_) {
        console.info(
          `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`
        )

        const notificationTokenInfo = yield* _(
          set(
            generateMyNotificationTokenInfoActionAtom,
            notificationToken,
            chatWithMessages.chat.inbox.privateKey
          )
        )

        const messageToSend = createFcmCypherUpdateMessage(
          chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
          Option.getOrUndefined(notificationTokenInfo),
          chatWithMessages.chat.otherSideFcmCypher
        )

        const result = yield* _(
          sendMessage({
            api: get(apiAtom).chat,
            senderKeypair: chatWithMessages.chat.inbox.privateKey,
            receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
            message: messageToSend,
            notificationApi: get(apiAtom).notification,
            theirNotificationCypher: chatWithMessages.chat.otherSideFcmCypher,
            otherSideVersion: chatWithMessages.chat.otherSideVersion,
          }),
          Effect.mapBoth({
            onSuccess: () => ({success: true as const, notificationTokenInfo}),
            onFailure: (e) => ({success: false as const, error: e}),
          }),
          Effect.merge
        )

        if (!result.success) {
          reportError('error', new Error('Error while refreshing fcm cypher'), {
            e: result.error,
          })
          console.warn(
            `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
            `Error refreshing ${result.error._tag}`
          )
          return false
        }

        const chatAtom = focusChatByInboxKeyAndSenderKey({
          inboxKey: chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
          senderKey: chatWithMessages.chat.otherSide.publicKey,
        })
        set(
          chatAtom,
          updateMyNotificationTokenInfoInChat(
            Option.getOrUndefined(result.notificationTokenInfo)
          )
        )

        console.info(
          `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
          'success'
        )
        return true
      })
    }
  }
)
