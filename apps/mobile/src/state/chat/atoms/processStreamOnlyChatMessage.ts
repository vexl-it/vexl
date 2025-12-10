import {decryptStreamOnlyChatMessageCypher} from '@vexl-next/resources-utils/src/chat/streamOnlyChatMessagePayload'
import {type StreamOnlyChatMessage} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Array, Effect, Option, pipe} from 'effect/index'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import {type InboxInState} from '../domain'
import {reportTypingIndicationReceivedActionAtom} from './typingIndication'

export const processStreamOnlyNotificationActionAtom = atom(
  null,
  (
    get,
    set,
    {message, inbox}: {message: StreamOnlyChatMessage; inbox: InboxInState}
  ) =>
    Effect.gen(function* (_) {
      const payload = yield* _(
        decryptStreamOnlyChatMessageCypher(
          message.message,
          inbox.inbox.privateKey.privateKeyPemBase64
        )
      )

      if (payload._tag === 'TypingMessage') {
        pipe(
          inbox.chats,
          Array.findFirst(
            (c) => c.chat.otherSide.publicKey === payload.myPublicKey
          ),
          Option.match({
            onNone: () => {
              reportError(
                'warn',
                new Error('Received typing indication for unknown chat')
              )
            },
            onSome: (chat) => {
              set(
                reportTypingIndicationReceivedActionAtom,
                chat.chat.id,
                payload.typing
              )
            },
          })
        )
      }
    })
)
