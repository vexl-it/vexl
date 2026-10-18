import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {createHistoryMessage} from '@vexl-next/resources-utils/src/chat/utils/chatHistory'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {reportErrorE} from '../../../utils/reportError'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
  type InboxInState,
} from '../domain'
import {
  chatsToAnswerWithHistory,
  chatsWaitingForHistoryRequest,
  messagesToShareAsHistory,
} from '../utils/chatRecovery'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'
import messagingStateAtom from './messagingStateAtom'
import {sendHistoryRequestActionAtom} from './refreshNotificationTokensActionAtom'

export const requestHistoryForRecoveredChatsActionAtom = atom(
  null,
  (get, set, inboxKey: PublicKeyPemBase64): Effect.Effect<void> =>
    pipe(
      get(messagingStateAtom),
      Array.findFirst(
        (one) => one.inbox.privateKey.publicKeyPemBase64 === inboxKey
      ),
      Option.match({
        onNone: () => [],
        onSome: chatsWaitingForHistoryRequest,
      }),
      Array.map((chat) =>
        taskToEffect(set(sendHistoryRequestActionAtom, chat)).pipe(
          Effect.map((sent) => {
            const chatAtom = focusChatByInboxKeyAndSenderKey({
              inboxKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
              senderKey: chat.chat.otherSide.publicKey,
            })
            const current = get(chatAtom)
            if (sent && current)
              set(chatAtom, {
                ...current,
                historyRequestedAt: unixMillisecondsNow(),
              })
          })
        )
      ),
      Effect.allWith({concurrency: 'unbounded'}),
      Effect.asVoid
    )
)

const sendHistoryActionAtom = atom(
  null,
  (get, set, chat: ChatWithMessages): Effect.Effect<void> =>
    sendMessage({
      api: get(apiAtom).chat,
      notificationApi: get(apiAtom).notification,
      senderKeypair: chat.chat.inbox.privateKey,
      receiverPublicKey: chat.chat.otherSide.publicKey,
      message: createHistoryMessage({
        senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
        myVersion: version,
        messages: messagesToShareAsHistory(chat),
      }),
      theirNotificationCypher:
        chat.chat.otherSideVexlToken ?? chat.chat.otherSideFcmCypher,
      otherSideVersion: chat.chat.otherSideVersion,
    }).pipe(
      Effect.tapError((e) =>
        reportErrorE('warn', new Error('Error sending chat history'), {e})
      ),
      Effect.ignore
    )
)

export const answerHistoryRequestsActionAtom = atom(
  null,
  (
    get,
    set,
    args: {inbox: InboxInState; newMessages: readonly ChatMessageWithState[]}
  ): Effect.Effect<void> =>
    pipe(
      chatsToAnswerWithHistory(args),
      Array.map((chat) => set(sendHistoryActionAtom, chat)),
      Effect.allWith({concurrency: 'unbounded'}),
      Effect.asVoid
    )
)
