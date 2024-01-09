import {Stack, Text, XStack, YStack} from 'tamagui'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import {TouchableOpacity} from 'react-native'
import React, {useMemo} from 'react'
import {useNavigation} from '@react-navigation/native'
import {type Atom, useAtomValue} from 'jotai'
import {selectAtom} from 'jotai/utils'
import MessagePreview from './LastMessagePreview'
import LastMessageDateView from './LastMessageDateView'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import selectOtherSideDataAtom from '../../../../../state/chat/atoms/selectOtherSideDataAtom'
import UserAvatar from '../../../../UserAvatar'
import UserNameWithSellingBuying from '../../../../UserNameWithSellingBuying'
import {useOfferForChatOrigin} from '../../../../../state/marketplace'

export interface ChatListData {
  chat: Chat
  lastMessage: ChatMessageWithState
}

function ChatListItem({dataAtom}: {dataAtom: Atom<ChatListData>}): JSX.Element {
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

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('ChatDetail', {
          otherSideKey: chatInfo.otherSide.publicKey,
          inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
        })
      }}
    >
      <Stack mt="$6">
        <XStack space="$2" ai={'center'}>
          <Stack h={48} w={48}>
            <UserAvatar
              grayScale={isAvatarGray}
              userImage={userAvatar}
              width={48}
              height={48}
            />
          </Stack>
          <YStack jc={'space-between'} alignSelf="stretch" f={1} py="$1">
            <XStack jc="space-between">
              <UserNameWithSellingBuying
                userName={userName}
                center={false}
                offerInfo={
                  chatInfo.origin.type !== 'unknown' && offer
                    ? {
                        offerType: offer.offerInfo.publicPart.offerType,
                        offerDirection: chatInfo.origin.type,
                      }
                    : undefined
                }
              />
              {isUnread && (
                <Stack
                  w={'$4'}
                  h={'$4'}
                  borderRadius={8}
                  backgroundColor={'$main'}
                />
              )}
            </XStack>
            <XStack jc="space-between">
              <Text
                color="$greyOnBlack"
                fos={16}
                numberOfLines={1}
                flex={1}
                ellipsizeMode={'clip'}
                mr={'$3'}
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
          <Stack jc={'flex-end'} alignSelf="stretch"></Stack>
        </XStack>
      </Stack>
    </TouchableOpacity>
  )
}

export default React.memo(ChatListItem)
