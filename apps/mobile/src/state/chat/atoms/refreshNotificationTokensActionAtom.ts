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
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {Option} from 'effect'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {apiAtom} from '../../../api'
import {version, versionCode} from '../../../utils/environment'
import {getNotificationToken} from '../../../utils/notifications'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {useAppState} from '../../../utils/useAppState'
import {startBenchmark} from '../../ActionBenchmarks'
import {getOrFetchNotificationServerPublicKeyActionAtom} from '../../notifications/fcmServerPublicKeyStore'
import {type ChatWithMessages} from '../domain'
import allChatsAtom from './allChatsAtom'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import generateMyNotificationTokenInfoActionAtom, {
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
          set(
            generateMyNotificationTokenInfoActionAtom,
            notificationToken,
            chatWithMessages.chat.inbox.privateKey
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

function doesOtherSideNeedsToBeNotifiedAboutTokenChange(
  notificationToken: ExpoNotificationToken | null,
  publicKeyFromServer: PublicKeyPemBase64
): (chat: ChatWithMessages) => boolean {
  return (chatWithMessages) => {
    if (!notificationToken) return !!chatWithMessages.chat.lastReportedFcmToken

    // Notify if we have notification token but we did not report it yet
    if (!chatWithMessages.chat.lastReportedFcmToken) return true

    const partsOfTheCypher = extractPartsOfNotificationCypher({
      notificationCypher: chatWithMessages.chat.lastReportedFcmToken.cypher,
    })

    return (
      // Cyher is not valid. Update it!
      Option.isNone(partsOfTheCypher) ||
      // we want to update token if expoV2 cypher is not used yet
      partsOfTheCypher.value.type !== 'expoV2' ||
      // The server public key has changed, update the token!
      partsOfTheCypher.value.data.serverPublicKey !== publicKeyFromServer ||
      // If the client version has changed, update the token!
      partsOfTheCypher.value.data.clientVersion !== versionCode ||
      // If the last reported token is not the same as the current token, update it!
      chatWithMessages.chat.lastReportedFcmToken?.token !== notificationToken
    )
  }
}

const refreshNotificationTokensActionAtom = atom(null, (get, set) => {
  const endBenchmark = startBenchmark('Refresh notification tokens')
  console.info(
    '🔥 Refresh notifications tokens',
    'Checking if notification cyphers needs to be updated'
  )

  void showDebugNotificationIfEnabled({
    title: 'refreshing notification tokens',
    subtitle: 'refreshNotificationTokensActionAtom',
    body: 'Checking if notification cyphers needs to be updated',
  })

  void pipe(
    T.Do,
    T.bind('notificationToken', getNotificationToken),
    T.bind('publicKeyFromServer', () =>
      set(getOrFetchNotificationServerPublicKeyActionAtom)
    ),
    T.chain(({notificationToken, publicKeyFromServer}) => {
      if (O.isNone(publicKeyFromServer)) {
        console.info(
          '🔥 Refresh notifications tokens',
          'No public key from server'
        )
        void showDebugNotificationIfEnabled({
          title: 'chat refreshing notTokens',
          subtitle: 'refreshNotificationTokensActionAtom',
          body: 'No public key from server',
        })
        return T.of(undefined)
      }

      return pipe(
        get(allChatsAtom),
        A.flatten,
        A.filter(
          doesOtherSideNeedsToBeNotifiedAboutTokenChange(
            notificationToken,
            publicKeyFromServer.value
          )
        ),
        (array) => {
          console.info(
            '🔥 Refresh notifications tokens',
            `Refreshing tokens in ${array.length} chats`
          )
          void showDebugNotificationIfEnabled({
            title: 'chat refreshing notTokens',
            subtitle: 'refreshNotificationTokensActionAtom',
            body: `Refreshing tokens in ${array.length} chats`,
          })
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
    }),
    T.map((a) => {
      endBenchmark()
      return a
    })
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
