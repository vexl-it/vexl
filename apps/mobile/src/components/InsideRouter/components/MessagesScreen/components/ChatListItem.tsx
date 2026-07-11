import {useNavigation} from '@react-navigation/native'
import {
  ChatMessageItem,
  Stack,
  type ChatMessageItemVariant,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useMemo, useRef} from 'react'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import selectOtherSideDataAtom from '../../../../../state/chat/atoms/selectOtherSideDataAtom'
import {createIsOtherSideTypingAtom} from '../../../../../state/chat/atoms/typingIndication'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../../../state/chat/domain'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'
import {noteForChatOriginAtom} from '../../../../../state/notes/atoms/notesState'
import {getOtherSideRealNameOrFriendLevel} from '../../../../../utils/chat/getOtherSideFriendLevel'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import formatChatTime from '../../../../ChatDetailScreen/utils/formatChatTime'
import UserAvatar from '../../../../UserAvatar'
import {deleteChatFromListActionAtom} from '../atoms'
import {getMessagePreviewText} from '../utils/getMessagePreviewText'
import ChatListItemLeftSwipeActions from './ChatListItemLeftSwipeActions'
import ChatListItemRightSwipeActions from './ChatListItemRightSwipeActions'

export interface ChatListData {
  chat: ChatWithMessages
  lastMessage: ChatMessageWithState
  tagLabels: readonly string[]
}

function ChatListItem({
  dataAtom,
}: {
  dataAtom: Atom<ChatListData>
}): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const swipeableRef = useRef<SwipeableMethods>(null)
  const navigation = useNavigation()

  const {
    chatInfoAtom,
    chatWithMessagesAtom,
    lastMessageAtom,
    isUnreadAtom,
    otherSideInfoAtom,
    otherSideLeftAtom,
    tagLabelsAtom,
  } = useMemo(() => {
    const chatInfoAtom = selectAtom(dataAtom, (data) => data.chat.chat)
    const chatWithMessagesAtom = selectAtom(dataAtom, (data) => data.chat)
    const lastMessageAtom = selectAtom(dataAtom, (data) => data.lastMessage)
    const isUnreadAtom = selectAtom(dataAtom, (data) => data.chat.chat.isUnread)
    const otherSideInfoAtom = selectOtherSideDataAtom(chatInfoAtom)
    const otherSideLeftAtom = selectAtom(dataAtom, ({lastMessage}) =>
      ['DELETE_CHAT', 'BLOCK_CHAT', 'INBOX_DELETED'].includes(
        lastMessage.message.messageType
      )
    )
    const tagLabelsAtom = selectAtom(dataAtom, (data) => data.tagLabels)

    return {
      chatInfoAtom,
      chatWithMessagesAtom,
      lastMessageAtom,
      isUnreadAtom,
      otherSideLeftAtom,
      otherSideInfoAtom,
      tagLabelsAtom,
    }
  }, [dataAtom])

  const chatInfo = useAtomValue(chatInfoAtom)
  const chat = useAtomValue(chatWithMessagesAtom)
  const isTyping = useAtomValue(
    useMemo(() => createIsOtherSideTypingAtom(chatInfo.id), [chatInfo.id])
  )
  const lastMessage = useAtomValue(lastMessageAtom)
  const isUnread = useAtomValue(isUnreadAtom)
  const {userName, image: userAvatar} = useAtomValue(otherSideInfoAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const tagLabels = useAtomValue(tagLabelsAtom)
  const offer = useOfferForChatOrigin(chatInfo.origin)
  const note = useAtomValue(
    useMemo(() => noteForChatOriginAtom(chatInfo.origin), [chatInfo.origin])
  )
  const deleteChatFromList = useSetAtom(deleteChatFromListActionAtom)
  const displayName =
    getOtherSideRealNameOrFriendLevel({
      offerInfo: offer?.offerInfo,
      note,
      chat,
      t,
    }) ?? userName
  const isNoteChat =
    chatInfo.origin.type === 'myNote' || chatInfo.origin.type === 'theirNote'
  const preview: {text: string; variant?: ChatMessageItemVariant} =
    isNoteChat && lastMessage.message.messageType === 'REQUEST_MESSAGING'
      ? {
          text:
            chatInfo.origin.type === 'myNote'
              ? t('notes.chat.respondedToYourNote')
              : t('notes.chat.respondedToTheirNote'),
          variant: 'highlighted',
        }
      : getMessagePreviewText({
          messageWithState: lastMessage,
          name: userName,
          t,
        })
  const time = formatChatTime(
    unixMillisecondsToLocaleDateTime(lastMessage.message.time),
    locale
  )

  return (
    <Stack>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={() => (
          <ChatListItemLeftSwipeActions
            onPress={() => {
              swipeableRef.current?.close()
              navigation.navigate('ChatTags', {chatId: chatInfo.id})
            }}
          />
        )}
        renderRightActions={() => (
          <ChatListItemRightSwipeActions
            onPress={() => {
              void deleteChatFromList({
                otherSideKey: chatInfo.otherSide.publicKey,
                inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
                skipAsk: otherSideLeft,
              })
              swipeableRef.current?.close()
            }}
          />
        )}
      >
        <Stack paddingHorizontal="$5" backgroundColor="$backgroundPrimary">
          <ChatMessageItem
            avatar={
              <Stack h="$9" w="$9">
                <UserAvatar
                  grayScale={otherSideLeft}
                  userImage={userAvatar}
                  width={40}
                  height={40}
                />
              </Stack>
            }
            name={displayName}
            message={preview.text}
            time={time}
            unread={isUnread}
            variant={preview.variant}
            isTyping={isTyping}
            tags={tagLabels}
            onPress={() => {
              navigation.navigate('ChatDetail', {
                otherSideKey: chatInfo.otherSide.publicKey,
                inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
              })
            }}
          />
        </Stack>
      </Swipeable>
    </Stack>
  )
}

export default React.memo(ChatListItem)
