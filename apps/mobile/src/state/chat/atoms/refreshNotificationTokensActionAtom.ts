import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type ChatMessage,
  type MyFcmTokenInfo,
} from '@vexl-next/domain/src/general/messaging'
import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {useAppState} from '../../../utils/useAppState'
import {type ChatWithMessages} from '../domain'
import isChatOpen from '../utils/isChatOpen'
import allChatsAtom from './allChatsAtom'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import generateMyFcmTokenInfoActionAtom, {
  updateMyFcmTokenInfoInChat,
} from './generateMyFcmTokenInfoActionAtom'

const FCM_TOKEN_UPDATE_MESSAGE_MINIMAL_VERSION = SemverString.parse('1.13.1')

function createFcmCypherUpdateMessage(
  senderPublicKey: PublicKeyPemBase64,
  info?: MyFcmTokenInfo,
  lastReceivedFcmCypher?: FcmCypher
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
    notificationToken?: FcmToken
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
        T.bind('fcmTokenInfo', () =>
          set(
            generateMyFcmTokenInfoActionAtom,
            notificationToken,
            chatWithMessages.chat.inbox.privateKey
          )
        ),
        T.bind('messageToSend', ({fcmTokenInfo}) =>
          T.of(
            createFcmCypherUpdateMessage(
              chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
              O.toUndefined(fcmTokenInfo),
              chatWithMessages.chat.otherSideFcmCypher
            )
          )
        ),
        TE.fromTask,
        TE.bind('sentMessage', ({messageToSend}) =>
          sendMessage({
            api: get(apiAtom).chat,
            senderKeypair: chatWithMessages.chat.inbox.privateKey,
            receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
            message: messageToSend,
            notificationApi: get(apiAtom).notification,
            theirFcmCypher: chatWithMessages.chat.otherSideFcmCypher,
            otherSideVersion: chatWithMessages.chat.otherSideVersion,
          })
        ),
        TE.map(({fcmTokenInfo}) => {
          const chatAtom = focusChatByInboxKeyAndSenderKey({
            inboxKey: chatWithMessages.chat.inbox.privateKey.publicKeyPemBase64,
            senderKey: chatWithMessages.chat.otherSide.publicKey,
          })
          set(chatAtom, updateMyFcmTokenInfoInChat(O.toUndefined(fcmTokenInfo)))
        }),
        TE.matchW(
          (e) => {
            if (e._tag !== 'NetworkErrorAxios') {
              reportError(
                'error',
                new Error('Error while refreshing fcm cypher'),
                {e}
              )
            }
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

function doesOtherSideNeedsToBeNotifiedAboutTokenChange(
  notificationToken?: FcmToken
): (chat: ChatWithMessages) => boolean {
  return (chatWithMessages) => {
    if (!isChatOpen(chatWithMessages)) return false

    if (!notificationToken) return !!chatWithMessages.chat.lastReportedFcmToken

    return (
      chatWithMessages.chat.lastReportedFcmToken?.token !== notificationToken
    )
  }
}

const refreshNotificationTokensActionAtom = atom(null, (get, set) => {
  console.info(
    '🔥 Refresh notifications tokens',
    'Checking if notification cyphers needs to be updated'
  )
  void pipe(
    getNotificationToken(),
    T.chain((notificationToken) =>
      pipe(
        get(allChatsAtom),
        A.flatten,
        A.filter(
          doesOtherSideNeedsToBeNotifiedAboutTokenChange(
            notificationToken ?? undefined
          )
        ),
        (array) => {
          console.info(
            '🔥 Refresh notifications tokens',
            `Refreshing tokens in ${array.length} chats`
          )
          return array
        },
        A.map(
          set(
            sendFcmCypherUpdateMessageActionAtom,
            notificationToken ?? undefined
          )
        ),
        T.sequenceSeqArray
      )
    )
  )()
})

export default refreshNotificationTokensActionAtom

export function useRefreshNotificationTokensForActiveChatsAssumeLogin(): void {
  const refreshNotificationTokens = useSetAtom(
    refreshNotificationTokensActionAtom
  )
  useAppState(
    useCallback(
      (appState) => {
        if (appState !== 'active') return
        refreshNotificationTokens()
      },
      [refreshNotificationTokens]
    )
  )
}
