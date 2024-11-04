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

const deleteAllInboxesActionAtom = atom(null, (get, set) => {
  const api = get(apiAtom)
  const inboxes = get(inboxesAtom)
  const chats = get(allChatsAtom).flat()

  return pipe(
    // SEND INBOX DELETED MESSAGES
    Array.map(chats, (oneChat) => {
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
          theirFcmCypher: oneChat.chat.otherSideFcmCypher,
          notificationApi: api.notification,
          otherSideVersion: oneChat.chat.otherSideVersion,
        }),
        Effect.ignoreLogged
      )
    }),
    // DELETE INBOXES
    Array.appendAll(
      Array.map(inboxes, (oneInbox) =>
        pipe(
          api.chat.deleteInbox({
            keyPair: oneInbox.privateKey,
          }),
          Effect.ignoreLogged
        )
      )
    ),
    Effect.all,
    Effect.andThen(() => {
      set(messagingStateAtom, [])
    }),
    effectToTaskEither
  )
})

export default deleteAllInboxesActionAtom
