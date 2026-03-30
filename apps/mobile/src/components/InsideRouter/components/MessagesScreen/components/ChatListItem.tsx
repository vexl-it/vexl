import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  Dot,
  DotTypingIndicator,
  Stack,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useMemo, useRef} from 'react'
import {TouchableOpacity} from 'react-native'
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
import UserAvatar from '../../../../UserAvatar'
import {deleteChatFromListActionAtom} from '../atoms'
import ChatListItemRightSwipeActions from './ChatListItemRightSwipeActions'
import LastMessageDateView from './LastMessageDateView'
import MessagePreview from './LastMessagePreview'

export interface ChatListData {
  chat: Chat
  lastMessage: ChatMessageWithState
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

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('ChatDetail', {
          otherSideKey: chatInfo.otherSide.publicKey,
          inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
        })
      }}
    >
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
          <XStack
            paddingVertical="$4"
            paddingHorizontal="$5"
            gap="$5"
            ai="center"
            backgroundColor="$backgroundPrimary"
          >
            <Stack h="$9" w="$9">
              <UserAvatar
                grayScale={otherSideLeft}
                userImage={userAvatar}
                width={40}
                height={40}
              />
            </Stack>
            <YStack jc="space-between" alignSelf="stretch" f={1} py="$1">
              <XStack jc="flex-start" gap="$2" alignItems="flex-start">
                {!!displayName && (
                  <Typography
                    color="$foregroundPrimary"
                    variant="paragraphSmall"
                  >
                    {displayName}
                  </Typography>
                )}
                {!!isUnread && (
                  <Dot
                    mt={3}
                    variant="small"
                    backgroundColor="$accentHighlightSecondary"
                  />
                )}
              </XStack>
              <XStack jc="space-between">
                {isTyping ? (
                  <DotTypingIndicator />
                ) : (
                  <MessagePreview
                    lastMessageAtom={lastMessageAtom}
                    name={userName}
                    unread={isUnread}
                    f={1}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    mr="$3"
                  />
                )}
                <Typography color="$foregroundSecondary" variant="description">
                  <LastMessageDateView lastMessageAtom={lastMessageAtom} />
                </Typography>
              </XStack>
            </YStack>
          </XStack>
        </Swipeable>
      </Stack>
    </TouchableOpacity>
  )
}

export default React.memo(ChatListItem)
