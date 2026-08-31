import {useFocusEffect} from '@react-navigation/native'
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {type OneNoteInState} from '@vexl-next/domain/src/general/notes'
import {
  Button,
  FabButton,
  FilterBar,
  PlusAdd,
  Stack,
  Typography,
  YStack,
  useTheme,
  type FilterBarItem,
} from '@vexl-next/ui'
import {Array, Effect, Option, Order, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {RefreshControl} from 'react-native'
import {getTokens} from 'tamagui'
import {type CommunityTabsScreenProps} from '../../../../../../navigationTypes'
import {
  myNotesAtom,
  othersNotesAtom,
} from '../../../../../../state/notes/atoms/notesState'
import {refreshNotesActionAtom} from '../../../../../../state/notes/atoms/refreshNotesActionAtom'
import {showNotesBoardIntroSheetIfNeededActionAtom} from '../../../../../../state/notes/atoms/showNotesBoardIntroSheetIfNeededActionAtom'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {notesBoardEnabledAtom} from '../../../../../../utils/preferences'
import {NoteCard} from '../../../../../Notes/NoteCard'

type Props = CommunityTabsScreenProps<'Board'>
type BoardFilter = 'all' | 'mine'
type BoardSection = 'ACTIVE' | 'EXPIRED'

type BoardListItem =
  | {readonly type: 'sectionHeader'; readonly section: BoardSection}
  | {readonly type: 'note'; readonly note: OneNoteInState}

interface ItemSeparatorProps {
  readonly leadingItem?: BoardListItem
  readonly trailingItem?: BoardListItem
}

const keyExtractor = (item: BoardListItem): string =>
  item.type === 'sectionHeader'
    ? `sectionHeader-${item.section}`
    : item.note.noteInfo.noteId

const toNoteItem = (note: OneNoteInState): BoardListItem => ({
  type: 'note',
  note,
})

// Newest first - notes carry an incrementing numeric id used for ordering.
const byNewestFirst = Order.mapInput(
  Order.reverse(Order.number),
  (note: OneNoteInState) => note.noteInfo.id
)

function BoardScreen(props: Props): React.JSX.Element {
  const notesBoardEnabled = useAtomValue(notesBoardEnabledAtom)

  if (!notesBoardEnabled) {
    return <BoardComingSoon />
  }

  return <NotesBoard {...props} />
}

function BoardComingSoon(): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack f={1} paddingHorizontal="$5" paddingTop="$5" alignItems="center">
      <YStack
        width="100%"
        maxWidth={360}
        alignItems="center"
        gap="$4"
        paddingHorizontal="$5"
        paddingVertical="$8"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <Stack
          width={48}
          height={4}
          borderRadius="$8"
          backgroundColor="$accentYellowPrimary"
        />
        <Typography
          variant="tabSmallBold"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {t('community.tabs.board')}
        </Typography>
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {t('community.board.comingSoon')}
        </Typography>
        <Typography
          variant="paragraphSmall"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {t('community.board.comingSoonDescription')}
        </Typography>
      </YStack>
    </YStack>
  )
}

function NotesBoard({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()
  const listRef = useRef<FlashListRef<BoardListItem>>(null)

  const othersNotes = useAtomValue(othersNotesAtom)
  const myNotes = useAtomValue(myNotesAtom)
  const refreshNotes = useSetAtom(refreshNotesActionAtom)
  const showIntroIfNeeded = useSetAtom(
    showNotesBoardIntroSheetIfNeededActionAtom
  )

  const [filter, setFilter] = useState<BoardFilter>(
    route.params?.initialFilter ?? 'all'
  )
  const [refreshing, setRefreshing] = useState(false)

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({offset: 0, animated: false})
  }, [])

  useEffect(() => {
    void Effect.runPromise(showIntroIfNeeded())
  }, [showIntroIfNeeded])

  useLayoutEffect(() => {
    scrollToTop()
  }, [filter, route.params?.filterSwitchRequestId, scrollToTop])

  useLayoutEffect(() => {
    if (route.params?.initialFilter) {
      setFilter(route.params.initialFilter)
    }
  }, [route.params?.filterSwitchRequestId, route.params?.initialFilter])

  const listItems = useMemo((): BoardListItem[] => {
    const now = Date.now()

    if (filter !== 'mine') {
      return pipe(
        othersNotes,
        Array.filter((note) => note.noteInfo.expiresAt > now),
        Array.sort(byNewestFirst),
        Array.map(toNoteItem)
      )
    }

    // Own notes stay visible after expiry until the state purges them.
    const sorted = pipe(myNotes, Array.sort(byNewestFirst))
    const expiredNotes = pipe(
      sorted,
      Array.filter((note) => note.noteInfo.expiresAt <= now)
    )

    if (!Array.isNonEmptyArray(expiredNotes))
      return Array.map(sorted, toNoteItem)

    const activeNotes = pipe(
      sorted,
      Array.filter((note) => note.noteInfo.expiresAt > now)
    )

    return [
      ...(Array.isNonEmptyArray(activeNotes)
        ? [
            {type: 'sectionHeader', section: 'ACTIVE'} satisfies BoardListItem,
            ...Array.map(activeNotes, toNoteItem),
          ]
        : []),
      {type: 'sectionHeader', section: 'EXPIRED'} satisfies BoardListItem,
      ...Array.map(expiredNotes, toNoteItem),
    ]
  }, [othersNotes, filter, myNotes])

  const handlePullToRefresh = useCallback(() => {
    setRefreshing(true)
    void Effect.runPromise(refreshNotes()).finally(() => {
      setRefreshing(false)
    })
  }, [refreshNotes])

  useFocusEffect(
    useCallback(() => {
      Effect.runFork(refreshNotes())
    }, [refreshNotes])
  )

  const goToCreateNote = useCallback(() => {
    navigation.navigate('CreateNote')
  }, [navigation])

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<BoardListItem>) => {
      if (item.type === 'sectionHeader')
        return (
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            {t(`notes.board.section.${item.section}`)}
          </Typography>
        )

      const {note} = item
      return (
        <NoteCard
          note={note}
          messageNumberOfLines={2}
          onPress={() => {
            navigation.navigate('NoteDetail', {noteId: note.noteInfo.noteId})
          }}
        />
      )
    },
    [navigation, t]
  )

  const filterItems: ReadonlyArray<FilterBarItem<BoardFilter>> = useMemo(
    () => [
      {label: t('notes.board.allNotes'), value: 'all'},
      {label: t('notes.board.myNotes'), value: 'mine'},
    ],
    [t]
  )

  const selectedFilterValues = useMemo(() => new Set([filter]), [filter])

  // FilterBar is multi-select; the board filter is single-select. Tapping the
  // other pill switches the filter, tapping the active pill keeps it selected
  // (the toggled-empty set yields no new value).
  const handleFilterChange = useCallback(
    (values: ReadonlySet<BoardFilter>) => {
      pipe(
        Array.fromIterable(values),
        Array.findFirst((one) => one !== filter),
        Option.map((one) => {
          setFilter(one)
        })
      )
    },
    [filter, setFilter]
  )

  return (
    <Stack flex={1}>
      <YStack paddingHorizontal="$5" paddingVertical="$7">
        <FilterBar
          items={filterItems}
          selectedValues={selectedFilterValues}
          onSelectedValuesChange={handleFilterChange}
        />
      </YStack>

      <FlashList
        ref={listRef}
        contentContainerStyle={
          Array.isEmptyReadonlyArray(listItems)
            ? emptyContentContainerStyle
            : listContentContainerStyle
        }
        data={listItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={(item) => item.type}
        maintainVisibleContentPosition={{disabled: true}}
        ItemSeparatorComponent={BoardListSeparator}
        ListEmptyComponent={
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="flex-start"
            gap="$5"
            padding="$7"
          >
            <Typography
              variant="heading3"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {filter === 'mine'
                ? t('notes.board.emptyMyTitle')
                : t('notes.board.emptyAllTitle')}
            </Typography>
            <Typography
              variant="description"
              color="$foregroundSecondary"
              textAlign="center"
            >
              {filter === 'mine'
                ? t('notes.board.emptyMyDescription')
                : t('notes.board.emptyAllDescription')}
            </Typography>
            <Button
              variant="tertiary"
              alignSelf="stretch"
              size="small"
              onPress={goToCreateNote}
            >
              {t('notes.board.newNote')}
            </Button>
          </YStack>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
            tintColor={theme.foregroundSecondary.get()}
          />
        }
      />

      <FabButton
        position="absolute"
        bottom="$5"
        right="$5"
        icon={<PlusAdd color={theme.black100.get()} size={24} />}
        label={t('notes.board.newNote')}
        onPress={goToCreateNote}
      />
    </Stack>
  )
}

function BoardListSeparator({
  leadingItem,
  trailingItem,
}: ItemSeparatorProps): React.JSX.Element {
  if (trailingItem?.type === 'sectionHeader')
    return <Stack height="$7" flexShrink={0} />
  if (leadingItem?.type === 'sectionHeader')
    return <Stack height="$4" flexShrink={0} />
  return <Stack height="$3" flexShrink={0} />
}

const listContentContainerStyle = {
  flexGrow: 1,
  paddingHorizontal: getTokens().space.$4.val,
  paddingTop: getTokens().space.$2.val,
  paddingBottom: getTokens().space.$12.val,
}

const emptyContentContainerStyle = {
  flexGrow: 1,
  paddingHorizontal: getTokens().space.$5.val,
  paddingTop: 0,
  paddingBottom: 0,
}

export default BoardScreen
