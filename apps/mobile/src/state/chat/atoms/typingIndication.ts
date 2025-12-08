import {
  TYPING_INDICATION_TIMEOUT_MS,
  TypingMessage,
  type Chat,
  type ChatId,
} from '@vexl-next/domain/src/general/messaging'
import {
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {encryptStreamOnlyChatMessagePayload} from '@vexl-next/resources-utils/src/chat/streamOnlyChatMessagePayload'
import {Console, Effect, HashMap, Option} from 'effect/index'
import {atom, useStore, type Atom} from 'jotai'
import {useEffect} from 'react'
import {apiAtom} from '../../../api'

export const ChatsWithTypingIndicationsAtom = atom<
  HashMap.HashMap<ChatId, UnixMilliseconds>
>(HashMap.empty())

export const ReportTypingIndicationReceivedActionAtom = atom(
  null,
  (_, set, chatId: ChatId, typing: boolean) => {
    typing
      ? set(
          ChatsWithTypingIndicationsAtom,
          HashMap.set(chatId, unixMillisecondsNow())
        )
      : set(ChatsWithTypingIndicationsAtom, HashMap.remove(chatId))
  }
)

export const createIsOtherSideTypingAtom = (chatId: ChatId): Atom<boolean> =>
  atom((get) =>
    get(ChatsWithTypingIndicationsAtom).pipe(
      HashMap.get(chatId),
      Option.map(
        (indicatedAt) => indicatedAt + TYPING_INDICATION_TIMEOUT_MS > Date.now()
      ),
      Option.getOrElse(() => false)
    )
  )

export function useManageTypingIndications(): void {
  const store = useStore()

  useEffect(() => {
    const timeout = setInterval(() => {
      store.set(
        ChatsWithTypingIndicationsAtom,
        HashMap.filter(
          (lastReported) =>
            lastReported + TYPING_INDICATION_TIMEOUT_MS > Date.now()
        )
      )
    }, TYPING_INDICATION_TIMEOUT_MS / 2)
    return () => {
      clearInterval(timeout)
    }
  }, [store])
}

export const createSendTypingIndicationForChatAtom = (
  chat: Chat
): Atom<(typing: boolean) => void> =>
  atom((get) => {
    const api = get(apiAtom)
    return (typing: boolean) =>
      Effect.gen(function* (_) {
        const encryptedMessage = yield* _(
          encryptStreamOnlyChatMessagePayload(
            new TypingMessage({
              typing,
              myPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
            }),
            chat.otherSide.publicKey
          )
        )

        const otherSideNotificationCypher = chat.otherSideFcmCypher

        // No token from other side...
        if (!otherSideNotificationCypher) {
          return
        }

        yield* _(
          api.notification.issueStreamOnlyMessage({
            message: encryptedMessage,
            notificationCypher: otherSideNotificationCypher,
          })
        )
      }).pipe(
        Effect.tapError((e) =>
          Console.warn('Error sending typing indication', e)
        ),
        Effect.runFork
      )
  })
