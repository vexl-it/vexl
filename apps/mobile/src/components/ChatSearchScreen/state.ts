import {
  type Chat,
  type ChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {type ChatMessageWithState} from '../../state/chat/domain'
import compareMessages from '../../state/chat/utils/compareMessages'
import chatShouldBeVisible from '../../state/chat/utils/isChatActive'
import {offersAtom} from '../../state/marketplace/atoms/offersState'
import {notesAtom} from '../../state/notes/atoms/notesState'
import {getOtherSideRealNameOrFriendLevel} from '../../utils/chat/getOtherSideFriendLevel'
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
  message: ChatMessageWithState
}

function getOfferForChat({
  chat,
  offers,
}: {
  chat: Chat
  offers: OneOfferInState[]
}): OneOfferInState | undefined {
  const {origin} = chat

  if (origin.type !== 'myOffer' && origin.type !== 'theirOffer')
    return undefined
  if (origin.offer) return origin.offer

  return offers.find((one) => one.offerInfo.offerId === origin.offerId)
}

function getNoteForChat({
  chat,
  notes,
}: {
  chat: Chat
  notes: readonly OneNoteInState[]
}): OneNoteInState | undefined {
  const {origin} = chat

  if (origin.type !== 'myNote' && origin.type !== 'theirNote') return undefined
  if (origin.note) return origin.note

  return notes.find((one) => one.noteInfo.noteId === origin.noteId)
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
  const notes = useAtomValue(notesAtom)

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
        const note = getNoteForChat({chat: chat.chat, notes})
        const displayName =
          getOtherSideRealNameOrFriendLevel({
            offerInfo: offer?.offerInfo,
            note,
            chat,
            t,
          }) ?? otherSideData.userName

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
      .sort((a, b) => compareMessages(b.lastMessage, a.lastMessage))
  }, [messagingState, notes, offers, t])

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
              message: messageWithState,
            },
          ]
        })
      )
      .sort((a, b) => compareMessages(b.message, a.message))

    return {chats, messages}
  }, [query, searchableChats])
}
