import {useNavigation} from '@react-navigation/native'
import {
  ChatMessageItem,
  Stack,
  SwipeableRow,
  TagLabel,
  TrashBin,
  type ChatMessageItemVariant,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useMemo} from 'react'
import selectOtherSideDataAtom from '../../../../../state/chat/atoms/selectOtherSideDataAtom'
import {createIsOtherSideTypingAtom} from '../../../../../state/chat/atoms/typingIndication'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../../../state/chat/domain'
import isNoteChatOrigin from '../../../../../state/chat/utils/isNoteChatOrigin'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'
import {noteForChatOriginAtom} from '../../../../../state/notes/atoms/notesState'
import {getOtherSideRealNameOrFriendLevel} from '../../../../../utils/chat/getOtherSideFriendLevel'
import {chatDetailRouteParams} from '../../../../../utils/chat/goToChatDetail'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {formattingLocaleAtom} from '../../../../../utils/localization/formattingLocaleAtom'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import formatChatTime from '../../../../ChatDetailScreen/utils/formatChatTime'
import {ProfileImageAvatar} from '../../../../ProfileImageAvatar'
import {deleteChatFromListActionAtom} from '../atoms'
import {getMessagePreviewText} from '../utils/getMessagePreviewText'

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
  const isNoteChat = isNoteChatOrigin(chatInfo.origin)
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
    <SwipeableRow
      leftAction={{
        icon: TagLabel,
        label: t('messages.tags.action'),
        variant: 'success',
        onPress: () => {
          navigation.navigate('ChatTags', {chatId: chatInfo.id})
        },
      }}
      rightAction={{
        icon: TrashBin,
        label: t('common.delete'),
        variant: 'destructive',
        onPress: () => {
          void deleteChatFromList({
            otherSideKey: chatInfo.otherSide.publicKey,
            inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
            skipAsk: otherSideLeft,
          })
        },
      }}
    >
      <Stack paddingHorizontal="$5" backgroundColor="$backgroundPrimary">
        <ChatMessageItem
          avatar={
            <ProfileImageAvatar
              grayscale={otherSideLeft}
              image={userAvatar}
              size="$9"
            />
          }
          name={displayName}
          message={preview.text}
          time={time}
          unread={isUnread}
          variant={preview.variant}
          isTyping={isTyping}
          tags={tagLabels}
          onPress={() => {
            navigation.navigate('ChatDetail', chatDetailRouteParams(chatInfo))
          }}
        />
      </Stack>
    </SwipeableRow>
  )
}

export default React.memo(ChatListItem)
