import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {useCallback} from 'react'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {useStore} from 'jotai'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {chatAtom} from '../atom'
import reportError from '../../../utils/reportError'
import addMessageToChat from '../utils/addMessageToChat'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import sendMessage from '@vexl-next/resources-utils/dist/chat/sendMessage'

export default function useSendMessage(): (_: {
  chat: ChatWithMessages
  message: ChatMessage
}) => T.Task<ChatMessageWithState> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    ({message, chat}) => {
      const thisChatAtom = chatAtom(chat.id)
      const messageToAdd: ChatMessageWithState = {
        state: 'sending',
        message,
      }
      store.set(thisChatAtom, addMessageToChat(messageToAdd))

      return pipe(
        sendMessage({
          message,
          api: api.chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
        }),
        TE.match(
          (error): ChatMessageWithState => {
            reportError('error', 'Error while sending message', error)
            return {
              state: 'sendingError',
              error,
              message,
            }
          },
          (): ChatMessageWithState => ({
            state: 'sent',
            message,
          })
        ),
        T.map((newMessageValue) => {
          store.set(thisChatAtom, addMessageToChat(newMessageValue))
          return newMessageValue
        })
      )
    },
    [api, store]
  )
}
