import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import shouldSendTerminationMessageToChat from '../utils/shouldSendTerminationMessageToChat'
import allChatsAtom from './allChatsAtom'
import messagingStateAtom, {inboxesAtom} from './messagingStateAtom'

export interface InboxDeletionProgress {
  step: 'closingChats' | 'deletingOfferInboxes'
  stepCompleted: number
  stepTotal: number
  completed: number
  total: number
}

const deleteAllInboxesActionAtom = atom(
  null,
  (
    get,
    set,
    params?: {
      onProgress?: (progress: InboxDeletionProgress) => void
    }
  ) => {
    const api = get(apiAtom)
    const inboxes = get(inboxesAtom)
    const chats = get(allChatsAtom).flat()

    // SEND INBOX DELETED MESSAGES
    const chatClosingEffects = Array.map(chats, (oneChat) => {
      if (!shouldSendTerminationMessageToChat(oneChat)) return Effect.void
      return pipe(
        sendMessage({
          api: api.chat,
          receiverPublicKey: oneChat.chat.otherSide.publicKey,
          message: {
            uuid: generateChatMessageId(),
            text: 'Inbox deleted',
            messageType: 'INBOX_DELETED' as const,
            time: unixMillisecondsNow(),
            senderPublicKey: oneChat.chat.inbox.privateKey.publicKeyPemBase64,
            myVersion: version,
          },
          senderKeypair: oneChat.chat.inbox.privateKey,
          theirNotificationToken: oneChat.chat.otherSideVexlToken,
          notificationApi: api.notification,
        }),
        Effect.ignoreLogged
      )
    })

    // DELETE INBOXES
    const inboxDeletionEffects = Array.map(inboxes, (oneInbox) =>
      pipe(
        api.chat.deleteInbox({
          keyPair: oneInbox.privateKey,
        }),
        Effect.ignoreLogged
      )
    )

    const total = chatClosingEffects.length + inboxDeletionEffects.length

    const withStepProgress = ({
      effects,
      step,
      completedBefore,
    }: {
      effects: ReadonlyArray<Effect.Effect<void>>
      step: InboxDeletionProgress['step']
      completedBefore: number
    }): ReadonlyArray<Effect.Effect<void>> =>
      Array.map(effects, (effect, index) =>
        pipe(
          effect,
          Effect.tap(() =>
            Effect.sync(() => {
              params?.onProgress?.({
                step,
                stepCompleted: index + 1,
                stepTotal: effects.length,
                completed: completedBefore + index + 1,
                total,
              })
            })
          )
        )
      )

    return pipe(
      withStepProgress({
        effects: chatClosingEffects,
        step: 'closingChats',
        completedBefore: 0,
      }),
      Array.appendAll(
        withStepProgress({
          effects: inboxDeletionEffects,
          step: 'deletingOfferInboxes',
          completedBefore: chatClosingEffects.length,
        })
      ),
      Effect.all,
      Effect.andThen(() => {
        set(messagingStateAtom, [])
      }),
      effectToTaskEither
    )
  }
)

export default deleteAllInboxesActionAtom
