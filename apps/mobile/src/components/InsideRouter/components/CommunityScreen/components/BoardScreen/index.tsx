import {FlashList, type ListRenderItemInfo} from '@shopify/flash-list'
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
import React, {useCallback, useEffect, useMemo, useState} from 'react'
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
import {boardFilterAtom, type BoardFilter} from './atoms'

type Props = CommunityTabsScreenProps<'Board'>

const keyExtractor = (note: OneNoteInState): string => note.noteInfo.noteId

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

function NotesBoard({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const theme = useTheme()

  const filter = useAtomValue(boardFilterAtom)
  const setFilter = useSetAtom(boardFilterAtom)
  const othersNotes = useAtomValue(othersNotesAtom)
  const myNotes = useAtomValue(myNotesAtom)
  const refreshNotes = useSetAtom(refreshNotesActionAtom)
  const showIntroIfNeeded = useSetAtom(
    showNotesBoardIntroSheetIfNeededActionAtom
  )

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    void Effect.runPromise(showIntroIfNeeded())
  }, [showIntroIfNeeded])

  const visibleNotes = useMemo(() => {
    const now = Date.now()
    const source: readonly OneNoteInState[] =
      filter === 'mine' ? myNotes : othersNotes
    return pipe(
      source,
      Array.filter((note) => note.noteInfo.expiresAt > now),
      Array.sort(byNewestFirst)
    )
  }, [othersNotes, filter, myNotes])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    void Effect.runPromise(refreshNotes()).finally(() => {
      setRefreshing(false)
    })
  }, [refreshNotes])

  const goToCreateNote = useCallback(() => {
    navigation.navigate('CreateNote')
  }, [navigation])

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<OneNoteInState>) => (
      <NoteCard
        note={item}
        messageNumberOfLines={2}
        onPress={() => {
          navigation.navigate('NoteDetail', {noteId: item.noteInfo.noteId})
        }}
      />
    ),
    [navigation]
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

  const isEmpty = visibleNotes.length === 0

  return (
    <Stack flex={1}>
      <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
        <FilterBar
          items={filterItems}
          selectedValues={selectedFilterValues}
          onSelectedValuesChange={handleFilterChange}
        />
      </YStack>

      {isEmpty ? (
        <YStack
          flex={1}
          pt="$5"
          alignItems="center"
          justifyContent="flex-start"
          gap="$4"
          paddingHorizontal="$6"
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
      ) : (
        <FlashList
          data={visibleNotes}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={NoteCardSeparator}
          contentContainerStyle={LIST_CONTENT_STYLE}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.foregroundSecondary.get()}
            />
          }
        />
      )}

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

function NoteCardSeparator(): React.JSX.Element {
  return <Stack height={getTokens().space.$3.val} />
}

const LIST_CONTENT_STYLE = {
  paddingHorizontal: getTokens().space.$4.val,
  paddingTop: getTokens().space.$2.val,
  paddingBottom: getTokens().space.$12.val,
}

export default BoardScreen
