import {
  Button,
  FlagReport,
  NavigationBar,
  PeopleUsers,
  RefreshArrowsRectangle,
  Screen,
  Stack,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {type IconProps} from '@vexl-next/ui/src/icons/types'
import {Effect, Either} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type RootStackScreenProps} from '../../navigationTypes'
import {importedContactsHashesAtom} from '../../state/contacts/atom/contactsStore'
import {deriveVisibleCommonFriendsForNote} from '../../state/marketplace/utils/visibleCommonFriends'
import {deleteNoteActionAtom} from '../../state/notes/atoms/deleteNoteActionAtom'
import {singleNoteAtom} from '../../state/notes/atoms/notesState'
import {reportNoteWithPromptActionAtom} from '../../state/notes/atoms/reportNoteActionAtom'
import {
  repostNoteActionAtom,
  undoRepostNoteActionAtom,
} from '../../state/notes/atoms/repostNoteActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import navigateToBoard from '../../utils/navigateToBoard'
import useSafeGoBack from '../../utils/useSafeGoBack'
import CommonFriends from '../CommonFriends'
import {showErrorAlert} from '../ErrorAlert'
import {globalDialogAtom} from '../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {NotePreview} from '../Notes/NotePreview'
import {useNoteChatNavigation} from '../Notes/useNoteChatNavigation'

type Props = RootStackScreenProps<'NoteDetail'>

function ActionRow({
  icon: Icon,
  label,
  destructive,
  onPress,
}: {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
  readonly destructive?: boolean
  readonly onPress: () => void
}): React.JSX.Element {
  const theme = useTheme()
  const color = destructive
    ? theme.redForeground.get()
    : theme.foregroundPrimary.get()

  return (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$4"
      paddingHorizontal="$4"
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
      <Icon color={color} size={24} />
      <Typography
        variant="paragraph"
        color={destructive ? '$redForeground' : '$foregroundPrimary'}
      >
        {label}
      </Typography>
    </XStack>
  )
}

export default function NoteDetailScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const {noteId} = route.params
  const {t} = useTranslation()
  const theme = useTheme()
  const goBack = useSafeGoBack()

  const noteAtom = useMemo(() => singleNoteAtom(noteId), [noteId])
  const note = useAtomValue(noteAtom)
  const importedContactsHashes = useAtomValue(importedContactsHashesAtom)
  const {isChatOpen, navigateToChat} = useNoteChatNavigation(noteId)

  const askDialog = useSetAtom(globalDialogAtom)
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const deleteNote = useSetAtom(deleteNoteActionAtom)
  const repostNote = useSetAtom(repostNoteActionAtom)
  const undoRepostNote = useSetAtom(undoRepostNoteActionAtom)
  const reportNoteWithPrompt = useSetAtom(reportNoteWithPromptActionAtom)

  const adminId = note?.ownershipInfo?.adminId
  const isMine = !!adminId

  const runNoteAction = useCallback(
    <A,>(effect: Effect.Effect<A, unknown>, onSuccess?: (value: A) => void) => {
      setLoading(true)
      void Effect.runPromise(effect.pipe(Effect.either)).then((result) => {
        setLoading(false)
        if (Either.isRight(result)) {
          onSuccess?.(result.right)
        } else {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: result.left,
          })
        }
      })
    },
    [setLoading, t]
  )

  const handleDelete = useCallback(() => {
    if (!adminId) return
    void Effect.runPromise(
      askDialog({
        title: t('notes.delete.dialogTitle'),
        subtitle: t('notes.delete.dialogDescription'),
        negativeButtonText: t('common.cancel'),
        positiveButtonText: t('notes.delete.confirm'),
        positiveButtonVariant: 'destructive',
      })
    ).then((confirmed) => {
      if (!confirmed) return
      runNoteAction(deleteNote({adminIds: [adminId]}), goBack)
    })
  }, [adminId, askDialog, deleteNote, goBack, runNoteAction, t])

  const navigateToAllNotes = useCallback(() => {
    navigateToBoard(navigation, 'all')
  }, [navigation])

  const handleRepost = useCallback(() => {
    runNoteAction(repostNote({noteId}), () => {
      Effect.runFork(
        askDialog({
          title: t('notes.repost.toastTitle'),
          subtitle: t('notes.repost.toastDescription'),
        })
      )
      navigateToAllNotes()
    })
  }, [askDialog, navigateToAllNotes, noteId, repostNote, runNoteAction, t])

  const handleUndoRepost = useCallback(() => {
    runNoteAction(undoRepostNote({noteId}), () => {
      Effect.runFork(
        askDialog({
          title: t('notes.repost.undoSuccessTitle'),
          subtitle: t('notes.repost.undoSuccessDescription'),
        })
      )
      navigateToAllNotes()
    })
  }, [askDialog, navigateToAllNotes, noteId, runNoteAction, t, undoRepostNote])

  const handleNoCommonFriendsPress = useCallback(() => {
    Effect.runFork(
      askDialog({
        title: t('offer.noCommonFriends.title'),
        subtitle: t('notes.detail.noCommonFriendsDescription'),
        positiveButtonText: t('common.gotIt'),
      })
    )
  }, [askDialog, t])

  const handleReport = useCallback(() => {
    void Effect.runPromise(reportNoteWithPrompt({noteId})).then((reported) => {
      if (!reported) return

      navigateToAllNotes()
    })
  }, [navigateToAllNotes, noteId, reportNoteWithPrompt])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('notes.detail.title')}
      rightActions={[{icon: XmarkCancelClose, onPress: goBack}]}
    />
  )

  if (!note) {
    return <Screen navigationBar={navigationBar}>{null}</Screen>
  }

  const commonFriends = deriveVisibleCommonFriendsForNote({
    noteInfo: note.noteInfo,
    importedContactsHashes,
  })
  const isReported = note.flags.reported
  const canRepost =
    !isMine &&
    !note.repostInfo &&
    note.noteInfo.publicPart.allowRepost &&
    !note.noteInfo.privatePart.viaRepost
  const showRepostRow = !isMine && (!!note.repostInfo || canRepost)
  const showReportRow = !isMine && !isReported
  const showActionsCard = showRepostRow || showReportRow

  const footer = isMine ? (
    <Button variant="destructive" onPress={handleDelete}>
      {t('notes.detail.deleteNote')}
    </Button>
  ) : isChatOpen ? (
    <Button variant="primary" onPress={navigateToChat}>
      {t('offer.goToChat')}
    </Button>
  ) : (
    <Button
      variant="primary"
      onPress={() => {
        navigation.navigate('SendMessageToNote', {noteId})
      }}
    >
      {t('notes.detail.sendMessage')}
    </Button>
  )

  return (
    <Screen scrollable navigationBar={navigationBar} footer={footer}>
      <YStack gap="$5" paddingTop="$4">
        <NotePreview note={note} />

        {!isMine ? (
          commonFriends.length > 0 ? (
            <CommonFriends
              commonConnectionsHashes={commonFriends}
              otherSideClubs={[]}
              label={t('notes.detail.commonFriendsCount', {
                count: commonFriends.length,
              })}
            />
          ) : (
            <XStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$5"
              gap="$1"
              alignItems="center"
              pressStyle={{opacity: 0.7}}
              onPress={handleNoCommonFriendsPress}
            >
              <PeopleUsers size={18} color={theme.foregroundSecondary.get()} />
              <Typography variant="micro" color="$foregroundSecondary" flex={1}>
                {t('offer.noCommonFriendsExplanation')}
              </Typography>
            </XStack>
          )
        ) : null}

        {showActionsCard ? (
          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            paddingVertical="$1"
          >
            {showRepostRow ? (
              note.repostInfo ? (
                <ActionRow
                  icon={RefreshArrowsRectangle}
                  label={t('notes.detail.undoRepost')}
                  onPress={handleUndoRepost}
                />
              ) : (
                <ActionRow
                  icon={RefreshArrowsRectangle}
                  label={t('notes.detail.repostNote')}
                  onPress={handleRepost}
                />
              )
            ) : null}
            {showRepostRow && showReportRow ? (
              <Stack
                height={1}
                marginHorizontal="$4"
                backgroundColor="$backgroundTertiary"
              />
            ) : null}
            {showReportRow ? (
              <ActionRow
                icon={FlagReport}
                label={t('notes.detail.reportNote')}
                destructive
                onPress={handleReport}
              />
            ) : null}
          </YStack>
        ) : null}
      </YStack>
    </Screen>
  )
}
