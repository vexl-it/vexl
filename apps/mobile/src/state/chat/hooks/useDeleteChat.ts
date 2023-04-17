import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import useSendMessage from './useSendMessage'
import * as T from 'fp-ts/Task'
import {chatAtom} from '../atom'
import {generateUuid} from '@vexl-next/domain/dist/utility/Uuid.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function useDeleteChat(): (args: {
  chatInfo: ChatWithMessages
  text: string
}) => T.Task<ChatMessageWithState> {
  const store = useStore()
  const sendMessage = useSendMessage()

  return useCallback(
    ({chatInfo, text}) => {
      const messageToSend: ChatMessage = {
        text,
        time: unixMillisecondsNow(),
        uuid: generateUuid(),
        messageType: 'DELETE_CHAT',
        senderPublicKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
      }

      return pipe(
        sendMessage({message: messageToSend, chat: chatInfo}),
        T.map((result) => {
          store.set(chatAtom(chatInfo.id), (old) => ({
            ...old,
            otherSide: {...old.otherSide, realLifeInfo: undefined},
            messages: [],
          }))
          return result
        })
      )
    },
    [store, sendMessage]
  )
}
