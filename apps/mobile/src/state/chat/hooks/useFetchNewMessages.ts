import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {
  type ChatMessageWithState,
  type ChatState,
  type InboxInState,
} from '../domain'
import * as TE from 'fp-ts/TaskEither'
import retrieveMessages, {
  type ApiErrorRetrievingMessages,
} from '@vexl-next/resources-utils/dist/chat/retrieveMessages'
import reportError from '../../../utils/reportError'
import * as T from 'fp-ts/Task'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import {messagingStateAtom} from '../atom'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import addMessagesToChats from '../utils/addMessagesToChats'
import createNewChatsFromMessages from '../utils/createNewChatsFromFirstMessages'
import {group} from 'group-items'

function splitMessagesArrayToNewChatsAndExistingChats({
  inbox,
  messages,
}: {
  inbox: InboxInState
  messages: ChatMessageWithState[]
}): {
  messageInNewChat: ChatMessageWithState[]
  messageInExistingChat: ChatMessageWithState[]
} {
  return group(messages)
    .by((oneMessage) =>
      inbox.chats.some(
        (oneChat) =>
          oneMessage.message.senderPublicKey === oneChat.otherSide.publicKey
      )
        ? 'messageInExistingChat'
        : 'messageInNewChat'
    )
    .asObject()
}

// TODO handle non text messages
function refreshInbox(
  api: ChatPrivateApi
): (
  inbox: InboxInState
) => TE.TaskEither<ApiErrorRetrievingMessages, InboxInState> {
  return (inbox: InboxInState) =>
    pipe(
      retrieveMessages({api, inboxKeypair: inbox.inbox.privateKey}),
      TE.map((one) => {
        if (one.errors.length > 0) {
          reportError('error', 'Error decrypting messages', one.errors)
        }
        return one.messages
      }),
      TE.map((newMessages) =>
        newMessages.map(
          (oneMessage): ChatMessageWithState => ({
            state: 'received',
            message: oneMessage,
          })
        )
      ),
      TE.map((newMessages) =>
        splitMessagesArrayToNewChatsAndExistingChats({
          inbox,
          messages: newMessages,
        })
      ),
      TE.map(({messageInNewChat, messageInExistingChat}) => {
        return {
          ...inbox,
          chats: [
            ...createNewChatsFromMessages(inbox.inbox)(messageInNewChat || []),
            ...addMessagesToChats(inbox.chats)(messageInExistingChat || []),
          ],
        }
      })
    )
}

function deletePulledMessagesReportLeft({
  api,
  keyPair,
}: {
  api: ChatPrivateApi
  keyPair: PrivateKeyHolder
}): T.Task<void> {
  return pipe(
    api.deletePulledMessages({keyPair}),
    TE.match(
      (error) => {
        reportError('error', 'Error deleting pulled messages', error)
      },
      () => {}
    )
  )
}

export default function useFetchMessages(): T.Task<ChatState> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    async () =>
      await pipe(
        store.get(messagingStateAtom),
        A.map((inbox) =>
          pipe(
            refreshInbox(api.chat)(inbox),
            TE.match(
              (error) => {
                reportError(
                  'error',
                  'Api Error fetching messages for inbox',
                  error
                )
                // todo Should this be displayed to the user?
                return inbox
              },
              (i) => {
                return i
              }
            ),
            T.chainFirst(() =>
              deletePulledMessagesReportLeft({
                api: api.chat,
                keyPair: inbox.inbox.privateKey,
              })
            )
          )
        ),
        T.sequenceSeqArray,
        T.map((updatedInboxes) =>
          pipe(
            store.get(messagingStateAtom),
            A.map(
              (oldInbox) =>
                updatedInboxes.find(
                  (newInbox) =>
                    newInbox.inbox.privateKey.publicKeyPemBase64 ===
                    oldInbox.inbox.privateKey.publicKeyPemBase64
                ) ?? oldInbox
            )
          )
        ),
        T.chainFirst((newInboxes) => {
          store.set(messagingStateAtom, newInboxes)
          return T.of(undefined)
        })
      )(),
    [api, store]
  )
}
