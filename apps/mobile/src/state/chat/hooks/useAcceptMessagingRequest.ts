import {useCallback} from 'react'
import {pipe} from 'fp-ts/function'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/dist/chat/confirmMessagingRequest'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {useStore} from 'jotai'
import * as TE from 'fp-ts/TaskEither'
import {chatAtom} from '../atom'
import addMessageToChat from '../utils/addMessageToChat'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function useAcceptMessagingRequest(): (args: {
  chat: ChatWithMessages
  approve: boolean
  text: string
}) => TE.TaskEither<
  ApiConfirmMessagingRequest | ErrorEncryptingMessage,
  ChatMessageWithState
> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    ({chat, approve, text}) =>
      pipe(
        confirmMessagingRequest({
          text,
          approve,
          api: api.chat,
          fromKeypair: chat.inbox.privateKey,
          toPublicKey: chat.otherSide.publicKey,
        }),
        TE.map((message): ChatMessageWithState => ({state: 'sent', message})),
        TE.map((message) => {
          store.set(chatAtom(chat.id), addMessageToChat(message))
          return message
        })
      ),
    [api, store]
  )
}
