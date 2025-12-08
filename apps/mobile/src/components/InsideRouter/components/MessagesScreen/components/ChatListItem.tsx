import {useNavigation} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {Array, pipe} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import React, {useMemo, useRef} from 'react'
import {TouchableOpacity} from 'react-native'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import {Stack, Text, XStack, YStack} from 'tamagui'
import selectOtherSideDataAtom from '../../../../../state/chat/atoms/selectOtherSideDataAtom'
import {createIsOtherSideTypingAtom} from '../../../../../state/chat/atoms/typingIndication'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {clubsWithMembersAtom} from '../../../../../state/clubs/atom/clubsWithMembersAtom'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
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

function ChatListItem({
  dataAtom,
}: {
  dataAtom: Atom<ChatListData>
}): React.ReactElement {
  const {t} = useTranslation()
  const swipeableRef = useRef<SwipeableMethods>(null)
  const navigation = useNavigation()
  const clubsWithMembers = useAtomValue(clubsWithMembersAtom)

  const {
    chatInfoAtom,
    lastMessageAtom,
    isUnreadAtom,
    otherSideInfoAtom,
    otherSideLeftAtom,
    otherSideClubsNamesAtom,
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
    const otherSideClubsNamesAtom = selectAtom(dataAtom, (data) =>
      pipe(
        clubsWithMembers,
        Array.filter((club) =>
          Array.contains(club.club.uuid)(data.chat.otherSide.clubsIds ?? [])
        ),
        Array.map((club) => club.club.name)
      )
    )

    return {
      chatInfoAtom,
      lastMessageAtom,
      isUnreadAtom,
      otherSideLeftAtom,
      otherSideInfoAtom,
      otherSideClubsNamesAtom,
    }
  }, [clubsWithMembers, dataAtom])

  const chatInfo = useAtomValue(chatInfoAtom)
  const isTyping = useAtomValue(
    useMemo(() => createIsOtherSideTypingAtom(chatInfo.id), [chatInfo.id])
  )
  const isUnread = useAtomValue(isUnreadAtom)
  const {userName, image: userAvatar} = useAtomValue(otherSideInfoAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const offer = useOfferForChatOrigin(chatInfo.origin)
  const deleteChatFromList = useSetAtom(deleteChatFromListActionAtom)
  const otherSideClubsNames = useAtomValue(otherSideClubsNamesAtom)

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
                  skipAsk: otherSideLeft,
                })
                swipeableRef.current?.close()
              }}
            />
          )}
        >
          <XStack gap="$2" ai="center" bc="$black">
            <Stack h={48} w={48}>
              <UserAvatar
                grayScale={otherSideLeft}
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
                <XStack ai="center" gap="$2" ml="$2" fs={1}>
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    color="$greyOnBlack"
                    ff="$body500"
                    mr="$1"
                  >
                    {otherSideClubsNames.length > 1
                      ? t('clubs.multipleClubs')
                      : otherSideClubsNames.map((clubName) => clubName)}
                  </Text>

                  {!!isUnread && (
                    <Stack
                      w={12}
                      h={12}
                      borderRadius={6}
                      backgroundColor="$main"
                    />
                  )}
                </XStack>
              </XStack>
              <XStack jc="space-between">
                <Text
                  f={1}
                  numberOfLines={1}
                  color="$greyOnBlack"
                  fos={16}
                  ellipsizeMode="tail"
                  mr="$3"
                >
                  {isTyping ? (
                    <Text color="$greyOnBlack" fs={14} ff="$body600">
                      {t('messages.typing')}
                    </Text>
                  ) : (
                    <MessagePreview
                      lastMessageAtom={lastMessageAtom}
                      name={userName}
                      unread={isUnread}
                    />
                  )}
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
