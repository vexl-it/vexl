import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatRecoveryProof} from '@vexl-next/domain/src/general/messaging'
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
  isPendingRecoveryChatExpired,
  messagesToShareAsHistory,
} from '../utils/chatRecovery'
import {myChatRecoveryProofToShare} from '../utils/myChatRecoveryProof'
import messagingStateAtom from './messagingStateAtom'
import {sendHistoryRequestActionAtom} from './refreshNotificationTokensActionAtom'

const updatePendingRecoveryChatsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      inboxKey,
      update,
    }: {
      inboxKey: PublicKeyPemBase64
      update: (chats: readonly ChatWithMessages[]) => ChatWithMessages[]
    }
  ) => {
    set(
      messagingStateAtom,
      Array.map((inbox) =>
        inbox.inbox.privateKey.publicKeyPemBase64 === inboxKey
          ? {
              ...inbox,
              pendingRecoveryChats: update(inbox.pendingRecoveryChats ?? []),
            }
          : inbox
      )
    )
  }
)

/**
 * Drops pending recovery chats that waited too long and asks the senders of
 * the others for their history. Also retries requests that failed earlier.
 */
export const processPendingRecoveryChatsActionAtom = atom(
  null,
  (get, set, inboxKey: PublicKeyPemBase64): Effect.Effect<void> =>
    Effect.suspend(() => {
      const now = unixMillisecondsNow()
      set(updatePendingRecoveryChatsActionAtom, {
        inboxKey,
        update: (chats) =>
          Array.filter(
            chats,
            (chat) => !isPendingRecoveryChatExpired({chat, now})
          ),
      })

      return pipe(
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
              if (!sent) return
              set(updatePendingRecoveryChatsActionAtom, {
                inboxKey,
                update: (chats) =>
                  Array.map(chats, (one) =>
                    one.chat.id === chat.chat.id
                      ? {...one, historyRequestedAt: unixMillisecondsNow()}
                      : one
                  ),
              })
            })
          )
        ),
        Effect.allWith({concurrency: 'unbounded'}),
        Effect.asVoid
      )
    })
)

const sendHistoryActionAtom = atom(
  null,
  (
    get,
    set,
    {
      chat,
      historyRecoveryProof,
    }: {chat: ChatWithMessages; historyRecoveryProof: ChatRecoveryProof}
  ): Effect.Effect<void> =>
    sendMessage({
      api: get(apiAtom).chat,
      notificationApi: get(apiAtom).notification,
      senderKeypair: chat.chat.inbox.privateKey,
      receiverPublicKey: chat.chat.otherSide.publicKey,
      message: createHistoryMessage({
        senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
        myVersion: version,
        messages: messagesToShareAsHistory(chat),
        historyRecoveryProof,
      }),
      theirNotificationCypher:
        chat.chat.otherSideVexlToken ?? chat.chat.otherSideFcmCypher,
      otherSideVersion: chat.chat.otherSideVersion,
      recoveryProof: myChatRecoveryProofToShare(get, chat),
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
      Array.filterMap((chat) =>
        Option.map(
          Option.fromNullable(chat.otherSideRecoveryProof),
          (historyRecoveryProof) =>
            set(sendHistoryActionAtom, {chat, historyRecoveryProof})
        )
      ),
      Effect.allWith({concurrency: 'unbounded'}),
      Effect.asVoid
    )
)
