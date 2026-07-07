import {useNavigation} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {SearchBar, Typography} from '@vexl-next/ui'
import {Option, pipe, Array as ReadonlyArray} from 'effect'
import {useAtomValue, type Atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import React from 'react'
import Animated from 'react-native-reanimated'
import {Stack} from 'tamagui'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import compareMessages from '../../../../../state/chat/utils/compareMessages'
import chatShouldBeVisible from '../../../../../state/chat/utils/isChatActive'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import {InsideScreenListHeader, useInsideScreenScroll} from '../../InsideScreen'
import ChatListItem, {type ChatListData} from './ChatListItem'

const ReanimatedFlashList: React.ComponentType<any> =
  Animated.createAnimatedComponent(FlashList)

const chatsListDataEquivalence = ReadonlyArray.getEquivalence<ChatListData>(
  (a, b) => a.chat === b.chat && a.lastMessage === b.lastMessage
)

const chatsListDataAtom = selectAtom(
  messagingStateAtom,
  (inboxes): ChatListData[] =>
    pipe(
      inboxes,
      ReadonlyArray.flatMap((inbox) => inbox.chats),
      ReadonlyArray.filter(chatShouldBeVisible),
      ReadonlyArray.filterMap((chat) =>
        Option.map(ReadonlyArray.last(chat.messages), (lastMessage) => ({
          chat,
          lastMessage,
        }))
      ),
      ReadonlyArray.sort<ChatListData>((a, b) =>
        compareMessages(b.lastMessage, a.lastMessage)
      )
    ),
  chatsListDataEquivalence
)

// Keyed by chat id so row atoms (and thus FlashList keys) stay stable
// when unrelated parts of the messaging state change.
const chatsListDataAtomsAtom = splitAtom(
  chatsListDataAtom,
  (item) => item.chat.chat.id
)

function renderItem({item}: {item: Atom<ChatListData>}): React.ReactElement {
  return <ChatListItem dataAtom={item} />
}

function ChatsList(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const elementAtoms = useAtomValue(chatsListDataAtomsAtom)
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()
  const {onScroll} = useInsideScreenScroll()

  const listHeaderComponent = (
    <InsideScreenListHeader>
      {elementAtoms.length > 0 ? (
        <Stack marginHorizontal="$5" marginBottom="$6">
          <SearchBar
            placeholder={t('messages.search.placeholder')}
            variant="dummy"
            onPress={() => {
              navigation.navigate('ChatSearch')
            }}
          />
        </Stack>
      ) : null}
    </InsideScreenListHeader>
  )

  const listEmptyComponent = (
    <EmptyListWrapper
      horizontalPadding
      inScrollView
      buttonText={t('messages.seeMarketplace')}
      onButtonPress={() => {
        navigation.navigate('InsideTabs', {
          screen: 'Marketplace',
        })
      }}
    >
      <Stack gap="$5" pt="$5">
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
  )

  return (
    <ReanimatedFlashList
      data={elementAtoms}
      keyExtractor={atomKeyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={listEmptyComponent}
      ListEmptyComponentStyle={{
        flex: 1,
        justifyContent: 'center',
      }}
      contentContainerStyle={{
        paddingBottom: tabBarEndsAt + 25,
      }}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  )
}

export default ChatsList
