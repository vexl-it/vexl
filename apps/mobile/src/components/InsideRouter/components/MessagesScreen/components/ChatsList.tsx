import {useNavigation} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {useAtomValue, type Atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import React from 'react'
import {Stack, Text} from 'tamagui'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import {type ChatWithMessages} from '../../../../../state/chat/domain'
import chatShouldBeVisible from '../../../../../state/chat/utils/isChatActive'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import notEmpty from '../../../../../utils/notEmpty'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import ChatListItem, {type ChatListData} from './ChatListItem'

const chatIdsAtom = selectAtom(messagingStateAtom, (inboxes): ChatListData[] =>
  inboxes
    .reduce<ChatWithMessages[]>((acc, one) => {
      return acc.concat(one.chats)
    }, [])
    .filter(chatShouldBeVisible)
    .map((one) => {
      if (one.messages.length === 0) return null

      const lastMessage = one.messages.at(-1)
      if (!lastMessage) return null

      return {chat: one.chat, lastMessage}
    })
    .filter(notEmpty)
    .sort(
      (a, b) =>
        (b.lastMessage?.message.time ?? 0) - (a.lastMessage?.message.time ?? 0)
    )
)

const chatIdAtomsAtom = splitAtom(chatIdsAtom)

function renderItem({item}: {item: Atom<ChatListData>}): React.ReactElement {
  return <ChatListItem dataAtom={item} />
}

function ChatsList(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const elementAtoms = useAtomValue(chatIdAtomsAtom)
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  if (elementAtoms.length === 0) {
    return (
      <Stack f={1} pb={tabBarEndsAt}>
        <EmptyListWrapper
          buttonText={t('messages.seeMarketplace')}
          onButtonPress={() => {
            navigation.navigate('InsideTabs', {
              screen: 'Marketplace',
            })
          }}
        >
          <Stack gap="$2">
            <Text textAlign="center" col="$greyOnWhite" fos={20} ff="$body600">
              {t('messages.youDontHaveAnyOpenChats')}
            </Text>
            <Text textAlign="center" fos={14} ta="center" col="$greyOnWhite">
              {t('messages.startConversationByReactingToOffer')}
            </Text>
          </Stack>
        </EmptyListWrapper>
      </Stack>
    )
  }

  return (
    <FlashList
      data={elementAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderItem}
      contentContainerStyle={{paddingBottom: tabBarEndsAt + 25}}
    />
  )
}

export default ChatsList
