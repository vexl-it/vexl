import {
  type Chat,
  type ChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {type ChatMessageWithState} from '../../state/chat/domain'
import chatShouldBeVisible from '../../state/chat/utils/isChatActive'
import {offersAtom} from '../../state/marketplace/atoms/offersState'
import {realUserNameAtom} from '../../state/session/userDataAtoms'
import {getChatDisplayName} from '../../utils/chat/getChatDisplayName'
import {type TFunction} from '../../utils/localization/I18nProvider'
import {getMessagePreviewText} from '../InsideRouter/components/MessagesScreen/utils/getMessagePreviewText'

export interface SearchableChat {
  chat: Chat
  messages: ChatMessageWithState[]
  displayName: string
  otherSideName: string
  avatar: ReturnType<typeof getOtherSideData>['image']
  lastMessage: ChatMessageWithState
  lastMessagePreviewText: string
}

export interface SearchMessageResult {
  chat: SearchableChat
  messageId: ChatMessageId
  messageText: string
  messageTime: UnixMilliseconds
}

function getOfferForChat({
  chat,
  offers,
}: {
  chat: Chat
  offers: OneOfferInState[]
}): OneOfferInState | undefined {
  const {origin} = chat

  if (origin.type === 'unknown') return undefined
  if (origin.offer) return origin.offer

  return offers.find((one) => one.offerInfo.offerId === origin.offerId)
}

export function useChatSearchResults({
  query,
  t,
}: {
  query: string
  t: TFunction
}): {
  chats: SearchableChat[]
  messages: SearchMessageResult[]
} {
  const messagingState = useAtomValue(messagingStateAtom)
  const offers = useAtomValue(offersAtom)
  const realUserName = useAtomValue(realUserNameAtom)

  const searchableChats = useMemo(() => {
    return messagingState
      .flatMap((inbox) => inbox.chats)
      .filter(chatShouldBeVisible)
      .flatMap((chat) => {
        if (chat.messages.length === 0) return []

        const lastMessage = chat.messages.at(-1)
        if (!lastMessage) return []

        const otherSideData = getOtherSideData(chat.chat)
        const offer = getOfferForChat({chat: chat.chat, offers})
        const displayName =
          getChatDisplayName({
            offerInfo: offer?.offerInfo,
            userName: realUserName,
            t,
          }) ?? ''

        return [
          {
            chat: chat.chat,
            messages: chat.messages,
            displayName,
            otherSideName: otherSideData.userName,
            avatar: otherSideData.image,
            lastMessage,
            lastMessagePreviewText: getMessagePreviewText({
              messageWithState: lastMessage,
              name: otherSideData.userName,
              t,
            }).text,
          },
        ]
      })
      .sort((a, b) => b.lastMessage.message.time - a.lastMessage.message.time)
  }, [messagingState, offers, realUserName, t])

  return useMemo(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery === '') return {chats: [], messages: []}

    const normalizedQuery = trimmedQuery.toLowerCase()

    const chats = searchableChats.filter((chat) =>
      chat.displayName.toLowerCase().includes(normalizedQuery)
    )

    const messages = searchableChats
      .flatMap((chat) =>
        chat.messages.flatMap((messageWithState) => {
          const messageText = messageWithState.message.text.trim()

          if (messageText === '') return []
          if (!messageText.toLowerCase().includes(normalizedQuery)) return []

          return [
            {
              chat,
              messageId: messageWithState.message.uuid,
              messageText,
              messageTime: messageWithState.message.time,
            },
          ]
        })
      )
      .sort((a, b) => b.messageTime - a.messageTime)

    return {chats, messages}
  }, [query, searchableChats])
}
