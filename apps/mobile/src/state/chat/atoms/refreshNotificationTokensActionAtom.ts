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
import {
  effectToTask,
  effectToTaskEither,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
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
  ): ((chatWithMessages: ChatWithMessages) => T.Task<boolean>) => {
    return (chatWithMessages) => {
      return pipe(
        T.Do,
        T.map((o) => {
          console.info(
            `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`
          )
          return o
        }),
        T.bind('notificationTokenInfo', () =>
          effectToTask(
            set(
              generateMyNotificationTokenInfoActionAtom,
              notificationToken,
              chatWithMessages.chat.inbox.privateKey
            )
          )
        ),
        T.bind('messageToSend', ({notificationTokenInfo}) =>
          T.of(
            createFcmCypherUpdateMessage(
              chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
              O.toUndefined(notificationTokenInfo),
              chatWithMessages.chat.otherSideFcmCypher
            )
          )
        ),
        TE.fromTask,
        TE.bind('sentMessage', ({messageToSend}) =>
          effectToTaskEither(
            sendMessage({
              api: get(apiAtom).chat,
              senderKeypair: chatWithMessages.chat.inbox.privateKey,
              receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
              message: messageToSend,
              notificationApi: get(apiAtom).notification,
              theirNotificationCypher: chatWithMessages.chat.otherSideFcmCypher,
              otherSideVersion: chatWithMessages.chat.otherSideVersion,
            })
          )
        ),
        TE.map(({notificationTokenInfo}) => {
          const chatAtom = focusChatByInboxKeyAndSenderKey({
            inboxKey: chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
            senderKey: chatWithMessages.chat.otherSide.publicKey,
          })
          set(
            chatAtom,
            updateMyNotificationTokenInfoInChat(
              O.toUndefined(notificationTokenInfo)
            )
          )
        }),
        TE.matchW(
          (e) => {
            reportError(
              'error',
              new Error('Error while refreshing fcm cypher'),
              {e}
            )
            console.warn(
              `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
              `Error refreshing ${e._tag}`
            )
            return false
          },
          () => {
            console.info(
              `🔥 Refresh notifications tokens',  'Refreshing chat with Id ${chatWithMessages.chat.id}`,
              'success'
            )
            return true
          }
        )
      )
    }
  }
)
