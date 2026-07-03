import {
  Button,
  FlagReport,
  NavigationBar,
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
import {deleteNoteActionAtom} from '../../state/notes/atoms/deleteNoteActionAtom'
import {singleNoteAtom} from '../../state/notes/atoms/notesState'
import {reportNoteWithPromptActionAtom} from '../../state/notes/atoms/reportNoteActionAtom'
import {
  repostNoteActionAtom,
  undoRepostNoteActionAtom,
} from '../../state/notes/atoms/repostNoteActionAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import CommonFriends from '../CommonFriends'
import {showErrorAlert} from '../ErrorAlert'
import {globalDialogAtom} from '../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {NotePreview} from '../Notes/NotePreview'
import {toastNotificationAtom} from '../ToastNotification/atom'

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
  const goBack = useSafeGoBack()

  const noteAtom = useMemo(() => singleNoteAtom(noteId), [noteId])
  const note = useAtomValue(noteAtom)

  const askDialog = useSetAtom(globalDialogAtom)
  const setLoading = useSetAtom(loadingOverlayDisplayedAtom)
  const setToast = useSetAtom(toastNotificationAtom)
  const deleteNote = useSetAtom(deleteNoteActionAtom)
  const repostNote = useSetAtom(repostNoteActionAtom)
  const undoRepostNote = useSetAtom(undoRepostNoteActionAtom)
  const reportNoteWithPrompt = useSetAtom(reportNoteWithPromptActionAtom)

  const adminId = note?.ownershipInfo?.adminId
  const isMine = !!adminId

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
      setLoading(true)
      void Effect.runPromise(
        deleteNote({adminIds: [adminId]}).pipe(Effect.either)
      ).then((result) => {
        setLoading(false)
        if (Either.isRight(result)) {
          goBack()
        } else {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: result.left,
          })
        }
      })
    })
  }, [adminId, askDialog, deleteNote, goBack, setLoading, t])

  const handleRepost = useCallback(() => {
    setLoading(true)
    void Effect.runPromise(repostNote({noteId}).pipe(Effect.either)).then(
      (result) => {
        setLoading(false)
        if (Either.isRight(result)) {
          setToast({
            title: t('notes.repost.toastTitle'),
            description: t('notes.repost.toastDescription'),
          })
        } else {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: result.left,
          })
        }
      }
    )
  }, [noteId, repostNote, setLoading, setToast, t])

  const handleUndoRepost = useCallback(() => {
    setLoading(true)
    void Effect.runPromise(undoRepostNote({noteId}).pipe(Effect.either)).then(
      (result) => {
        setLoading(false)
        if (Either.isLeft(result)) {
          showErrorAlert({
            title: t('common.somethingWentWrong'),
            error: result.left,
          })
        }
      }
    )
  }, [noteId, setLoading, t, undoRepostNote])

  const handleReport = useCallback(() => {
    void Effect.runPromise(reportNoteWithPrompt({noteId}))
  }, [noteId, reportNoteWithPrompt])

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

  const commonFriends = note.noteInfo.privatePart.commonFriends
  const isReported = note.flags.reported
  const canRepost =
    !isMine && !note.repostInfo && note.noteInfo.publicPart.allowRepost
  const showRepostRow = !isMine && (!!note.repostInfo || canRepost)
  const showReportRow = !isMine && !isReported
  const showActionsCard = showRepostRow || showReportRow

  const footer = isMine ? (
    <Button variant="destructive" onPress={handleDelete}>
      {t('notes.detail.deleteNote')}
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

        {!isMine && commonFriends.length > 0 ? (
          <CommonFriends
            commonConnectionsHashes={commonFriends}
            otherSideClubs={[]}
            label={t('notes.detail.commonFriendsCount', {
              count: commonFriends.length,
            })}
          />
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
