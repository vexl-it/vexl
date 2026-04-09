import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
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
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'
import {realUserNameAtom} from '../../../../../state/session/userDataAtoms'
import {getChatDisplayName} from '../../../../../utils/chat/getChatDisplayName'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import unixMillisecondsToLocaleDateTime from '../../../../../utils/unixMillisecondsToLocaleDateTime'
import formatChatTime from '../../../../ChatDetailScreen/utils/formatChatTime'
import UserAvatar from '../../../../UserAvatar'
import {deleteChatFromListActionAtom} from '../atoms'
import {getMessagePreviewText} from '../utils/getMessagePreviewText'
import ChatListItemRightSwipeActions from './ChatListItemRightSwipeActions'

export interface ChatListData {
  chat: Chat
  lastMessage: ChatMessageWithState
}

function getPreviewVariant(color?: string): ChatMessageItemVariant {
  switch (color) {
    case '$green':
      return 'success'
    case '$red':
      return 'destructive'
    case '$main':
      return 'highlighted'
    default:
      return 'default'
  }
}

function ChatListItem({
  dataAtom,
}: {
  dataAtom: Atom<ChatListData>
}): React.ReactElement {
  const {t} = useTranslation()
  const swipeableRef = useRef<SwipeableMethods>(null)
  const navigation = useNavigation()

  const {
    chatInfoAtom,
    lastMessageAtom,
    isUnreadAtom,
    otherSideInfoAtom,
    otherSideLeftAtom,
  } = useMemo(() => {
    const chatInfoAtom = selectAtom(dataAtom, (data) => data.chat)
    const lastMessageAtom = selectAtom(dataAtom, (data) => data.lastMessage)
    const isUnreadAtom = selectAtom(dataAtom, (data) => data.chat.isUnread)
    const otherSideInfoAtom = selectOtherSideDataAtom(chatInfoAtom)
    const otherSideLeftAtom = selectAtom(dataAtom, ({lastMessage}) =>
      ['DELETE_CHAT', 'BLOCK_CHAT', 'INBOX_DELETED'].includes(
        lastMessage.message.messageType
      )
    )

    return {
      chatInfoAtom,
      lastMessageAtom,
      isUnreadAtom,
      otherSideLeftAtom,
      otherSideInfoAtom,
    }
  }, [dataAtom])

  const chatInfo = useAtomValue(chatInfoAtom)
  const isTyping = useAtomValue(
    useMemo(() => createIsOtherSideTypingAtom(chatInfo.id), [chatInfo.id])
  )
  const lastMessage = useAtomValue(lastMessageAtom)
  const isUnread = useAtomValue(isUnreadAtom)
  const {userName, image: userAvatar} = useAtomValue(otherSideInfoAtom)
  const realUserName = useAtomValue(realUserNameAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const offer = useOfferForChatOrigin(chatInfo.origin)
  const deleteChatFromList = useSetAtom(deleteChatFromListActionAtom)
  const displayName = getChatDisplayName({
    offerInfo: offer?.offerInfo,
    userName: realUserName,
    t,
  })
  const preview = getMessagePreviewText({
    messageWithState: lastMessage,
    name: userName,
    t,
  })
  const time = formatChatTime(
    unixMillisecondsToLocaleDateTime(lastMessage.message.time)
  )

  return (
    <Stack>
      <Swipeable
        ref={swipeableRef}
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
            name={displayName ?? ''}
            message={preview.text}
            time={time}
            unread={isUnread}
            variant={getPreviewVariant(preview.color)}
            isTyping={isTyping}
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
