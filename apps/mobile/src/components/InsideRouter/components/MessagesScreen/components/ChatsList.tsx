import {useNavigation} from '@react-navigation/native'
import {FlashList} from '@shopify/flash-list'
import {
  FilterBar,
  type FilterBarItem,
  SearchBar,
  TagLabel,
  Typography,
} from '@vexl-next/ui'
import {Option, pipe, Array as ReadonlyArray} from 'effect'
import {atom, type Atom, useAtom, useAtomValue} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import React from 'react'
import Animated from 'react-native-reanimated'
import {Stack} from 'tamagui'
import messagingStateAtom from '../../../../../state/chat/atoms/messagingStateAtom'
import compareMessages from '../../../../../state/chat/utils/compareMessages'
import chatShouldBeVisible from '../../../../../state/chat/utils/isChatActive'
import {
  chatTagsAtom,
  chatTagsStateAtom,
  selectedChatTagFiltersAtom,
} from '../../../../../state/chatTags/atoms'
import {
  chatMatchesTagFilters,
  type ChatTag,
  type ChatTagId,
  tagIdsAssignedToChats,
  tagLabelsForChat,
} from '../../../../../state/chatTags/domain'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import EmptyListWrapper from '../../../../EmptyListWrapper'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import {InsideScreenListHeader, useInsideScreenScroll} from '../../InsideScreen'
import ChatListItem, {type ChatListData} from './ChatListItem'

const ReanimatedFlashList: React.ComponentType<any> =
  Animated.createAnimatedComponent(FlashList)

const tagLabelsEquivalence = ReadonlyArray.getEquivalence<string>(
  (left, right) => left === right
)

const chatsListDataEquivalence = ReadonlyArray.getEquivalence<ChatListData>(
  (a, b) =>
    a.chat === b.chat &&
    a.lastMessage === b.lastMessage &&
    tagLabelsEquivalence(a.tagLabels, b.tagLabels)
)

const visibleChatsAtom = atom((get) =>
  pipe(
    get(messagingStateAtom),
    ReadonlyArray.flatMap((inbox) => inbox.chats),
    ReadonlyArray.filter(chatShouldBeVisible)
  )
)

const chatsListDataSourceAtom = atom((get): ChatListData[] => {
  const tagState = get(chatTagsStateAtom)
  const selectedTagIds = get(selectedChatTagFiltersAtom)

  return pipe(
    get(visibleChatsAtom),
    ReadonlyArray.filter((chat) =>
      chatMatchesTagFilters({
        state: tagState,
        chatId: chat.chat.id,
        selectedTagIds,
      })
    ),
    ReadonlyArray.filterMap((chat) =>
      Option.map(ReadonlyArray.last(chat.messages), (lastMessage) => ({
        chat,
        lastMessage,
        tagLabels: tagLabelsForChat(tagState, chat.chat.id),
      }))
    ),
    ReadonlyArray.sort<ChatListData>((a, b) =>
      compareMessages(b.lastMessage, a.lastMessage)
    )
  )
})

const chatsListDataAtom = selectAtom(
  chatsListDataSourceAtom,
  (chats): ChatListData[] => chats,
  chatsListDataEquivalence
)

// Tags that aren't assigned to any currently visible chat wouldn't change
// the list if selected, so they're hidden from the filter bar.
const filterableChatTagIdsAtom = atom((get) => {
  const visibleChatIds = new Set(
    pipe(
      get(visibleChatsAtom),
      ReadonlyArray.map((chat) => chat.chat.id)
    )
  )

  return tagIdsAssignedToChats(get(chatTagsStateAtom), visibleChatIds)
})

type ChatTagFilterValue = 'all' | ChatTagId

function chatTagFilterItems({
  allChatsLabel,
  tags,
}: {
  readonly allChatsLabel: string
  readonly tags: ReadonlyArray<ChatTag>
}): ReadonlyArray<FilterBarItem<ChatTagFilterValue>> {
  return [
    {key: 'all', label: allChatsLabel, value: 'all'},
    ...pipe(
      tags,
      ReadonlyArray.map(
        (tag): FilterBarItem<ChatTagFilterValue> => ({
          label: tag.name,
          key: tag.id,
          value: tag.id,
          icon: TagLabel,
        })
      )
    ),
  ]
}

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
  const tags = useAtomValue(chatTagsAtom)
  const filterableTagIds = useAtomValue(filterableChatTagIdsAtom)
  const [selectedTagIds, setSelectedTagIds] = useAtom(
    selectedChatTagFiltersAtom
  )
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()
  const {onScroll} = useInsideScreenScroll()
  React.useEffect(() => {
    const nextSelectedTagIds = new Set(
      pipe(
        selectedTagIds,
        ReadonlyArray.fromIterable,
        ReadonlyArray.filter((tagId) => filterableTagIds.has(tagId))
      )
    )

    if (nextSelectedTagIds.size !== selectedTagIds.size) {
      setSelectedTagIds(nextSelectedTagIds)
    }
  }, [filterableTagIds, selectedTagIds, setSelectedTagIds])
  const filterableTags = React.useMemo(
    () =>
      pipe(
        tags,
        ReadonlyArray.filter((tag) => filterableTagIds.has(tag.id))
      ),
    [tags, filterableTagIds]
  )
  const filterItems = React.useMemo(
    () =>
      chatTagFilterItems({
        allChatsLabel: t('messages.tags.allChats'),
        tags: filterableTags,
      }),
    [t, filterableTags]
  )
  const selectedFilterValues = React.useMemo(() => {
    const values = new Set<ChatTagFilterValue>(selectedTagIds)
    if (selectedTagIds.size === 0) values.add('all')
    return values
  }, [selectedTagIds])

  const listHeaderComponent = (
    <InsideScreenListHeader>
      {elementAtoms.length > 0 ||
      ReadonlyArray.isNonEmptyReadonlyArray(filterableTags) ? (
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
      {ReadonlyArray.isNonEmptyReadonlyArray(filterableTags) ? (
        <Stack marginBottom="$6">
          <FilterBar
            items={filterItems}
            selectedValues={selectedFilterValues}
            containerStyle={{paddingHorizontal: '$5'}}
            onSelectedValuesChange={(nextValues) => {
              if (nextValues.has('all') && !selectedFilterValues.has('all')) {
                setSelectedTagIds(new Set())
                return
              }

              setSelectedTagIds(
                new Set(
                  pipe(
                    nextValues,
                    ReadonlyArray.fromIterable,
                    ReadonlyArray.filter(
                      (value): value is ChatTagId => value !== 'all'
                    )
                  )
                )
              )
            }}
          />
        </Stack>
      ) : null}
    </InsideScreenListHeader>
  )

  const listEmptyComponent =
    selectedTagIds.size > 0 ? null : (
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
      maintainVisibleContentPosition={{disabled: true}}
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
