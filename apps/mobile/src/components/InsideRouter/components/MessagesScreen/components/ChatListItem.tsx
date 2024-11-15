import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useMemo, useRef} from 'react'
import {TouchableOpacity} from 'react-native'
import {Swipeable} from 'react-native-gesture-handler'
import {Stack, Text, XStack, YStack} from 'tamagui'
import selectOtherSideDataAtom from '../../../../../state/chat/atoms/selectOtherSideDataAtom'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'
import UserAvatar from '../../../../UserAvatar'
import UserNameWithSellingBuying from '../../../../UserNameWithSellingBuying'
import {deleteChatFromListActionAtom} from '../atoms'
import ChatListItemRightSwipeActions from './ChatListItemRightSwipeActions'
import LastMessageDateView from './LastMessageDateView'
import MessagePreview from './LastMessagePreview'

export interface ChatListData {
  chat: Chat
  lastMessage: ChatMessageWithState
}

function ChatListItem({dataAtom}: {dataAtom: Atom<ChatListData>}): JSX.Element {
  const swipeableRef = useRef<Swipeable>(null)
  const navigation = useNavigation()

  const {
    chatInfoAtom,
    lastMessageAtom,
    isUnreadAtom,
    otherSideInfoAtom,
    isAvatarGrayAtom,
  } = useMemo(() => {
    const chatInfoAtom = selectAtom(dataAtom, (data) => data.chat)
    const lastMessageAtom = selectAtom(dataAtom, (data) => data.lastMessage)
    const isUnreadAtom = selectAtom(dataAtom, (data) => data.chat.isUnread)
    const otherSideInfoAtom = selectOtherSideDataAtom(chatInfoAtom)
    const isAvatarGrayAtom = selectAtom(dataAtom, ({lastMessage}) =>
      ['DELETE_CHAT', 'BLOCK_CHAT', 'INBOX_DELETED'].includes(
        lastMessage.message.messageType
      )
    )

    return {
      chatInfoAtom,
      lastMessageAtom,
      isUnreadAtom,
      otherSideInfoAtom,
      isAvatarGrayAtom,
    }
  }, [dataAtom])

  const chatInfo = useAtomValue(chatInfoAtom)
  const isUnread = useAtomValue(isUnreadAtom)
  const {userName, image: userAvatar} = useAtomValue(otherSideInfoAtom)
  const isAvatarGray = useAtomValue(isAvatarGrayAtom)
  const offer = useOfferForChatOrigin(chatInfo.origin)
  const deleteChatFromList = useSetAtom(deleteChatFromListActionAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('ChatDetail', {
          otherSideKey: chatInfo.otherSide.publicKey,
          inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
        })
      }}
    >
      <Stack mt="$6" br="$2">
        <Swipeable
          ref={swipeableRef}
          renderRightActions={() => (
            <ChatListItemRightSwipeActions
              onPress={() => {
                void deleteChatFromList({
                  otherSideKey: chatInfo.otherSide.publicKey,
                  inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
                })
                swipeableRef.current?.close()
              }}
            />
          )}
        >
          <XStack gap="$2" ai="center" bc="$black">
            <Stack h={48} w={48}>
              <UserAvatar
                grayScale={isAvatarGray}
                userImage={userAvatar}
                width={48}
                height={48}
              />
            </Stack>
            <YStack jc="space-between" alignSelf="stretch" f={1} py="$1">
              <XStack jc="space-between">
                <UserNameWithSellingBuying
                  userName={userName}
                  center={false}
                  offerInfo={
                    chatInfo.origin.type !== 'unknown' && offer
                      ? offer.offerInfo
                      : undefined
                  }
                />
                {!!isUnread && (
                  <Stack
                    w={12}
                    h={12}
                    borderRadius={6}
                    backgroundColor="$main"
                  />
                )}
              </XStack>
              <XStack jc="space-between">
                <Text
                  color="$greyOnBlack"
                  fos={16}
                  numberOfLines={1}
                  flex={1}
                  ellipsizeMode="clip"
                  mr="$3"
                >
                  <MessagePreview
                    lastMessageAtom={lastMessageAtom}
                    name={userName}
                    unread={isUnread}
                  />
                </Text>
                <Text color="$greyOnBlack">
                  <LastMessageDateView lastMessageAtom={lastMessageAtom} />
                </Text>
              </XStack>
            </YStack>
            <Stack jc="flex-end" alignSelf="stretch"></Stack>
          </XStack>
        </Swipeable>
      </Stack>
    </TouchableOpacity>
  )
}

export default React.memo(ChatListItem)
