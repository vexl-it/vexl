import {useNavigation} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {SearchBar, Typography} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import React from 'react'
import {Stack} from 'tamagui'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import {type ChatWithMessages} from '../../../../../state/chat/domain'
import chatShouldBeVisible from '../../../../../state/chat/utils/isChatActive'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import notEmpty from '../../../../../utils/notEmpty'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import Screen from '../../../../Screen'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import {useInsideScreenScroll} from '../../InsideScreen'
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
  const {onScroll} = useInsideScreenScroll()

  if (elementAtoms.length === 0) {
    return (
      <Screen>
        <EmptyListWrapper
          buttonText={t('messages.seeMarketplace')}
          onButtonPress={() => {
            navigation.navigate('InsideTabs', {
              screen: 'Marketplace',
            })
          }}
        >
          <Stack gap="$5">
            <Typography
              color="$foregroundPrimary"
              variant="heading3"
              textAlign="center"
            >
              {t('messages.youDontHaveAnyOpenChats')}
            </Typography>
            <Typography
              color="$foregroundSecondary"
              variant="description"
              textAlign="center"
              ta="center"
            >
              {t('messages.startConversationByReactingToOffer')}
            </Typography>
          </Stack>
        </EmptyListWrapper>
      </Screen>
    )
  }

  return (
    <Screen>
      <Stack marginHorizontal="$5">
        <SearchBar
          placeholder={t('messages.search.placeholder')}
          variant="dummy"
          onPress={() => {
            navigation.navigate('ChatSearch')
          }}
        />
      </Stack>
      <FlashList
        data={elementAtoms}
        keyExtractor={atomKeyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: tabBarEndsAt + 25,
          paddingTop: 24,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    </Screen>
  )
}

export default ChatsList
