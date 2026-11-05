import {
  Button,
  FlagReport,
  InfoBox,
  Menu,
  MenuItem,
  NavigationBar,
  PeopleUsers,
  RefreshArrowsRectangle,
  Screen,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
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
import {randomSeedFromNote} from '../../utils/RandomSeed'
import useSafeGoBack from '../../utils/useSafeGoBack'
import CommonFriends from '../CommonFriends'
import {showErrorAlert} from '../ErrorAlert'
import {globalDialogAtom} from '../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {NotePreview} from '../Notes/NotePreview'
import {useNoteChatNavigation} from '../Notes/useNoteChatNavigation'

type Props = RootStackScreenProps<'NoteDetail'>

export default function NoteDetailScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const {noteId} = route.params
  const {t} = useTranslation()
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

  const {commonFriends, verifiedCommonFriends} =
    deriveVisibleCommonFriendsForNote({
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
              verifiedConnectionsHashes={verifiedCommonFriends}
              otherSideClubs={[]}
              friendLevel={note.noteInfo.privatePart.friendLevel}
              isMine={false}
              otherSide={{
                role: 'otherSide',
                avatarSeed: randomSeedFromNote(note),
              }}
              label={t('notes.detail.commonFriendsCount', {
                count: commonFriends.length,
              })}
            />
          ) : (
            <InfoBox icon={PeopleUsers} onPress={handleNoCommonFriendsPress}>
              {t('offer.noCommonFriendsExplanation')}
            </InfoBox>
          )
        ) : null}

        {showActionsCard ? (
          <Menu>
            {showRepostRow ? (
              <MenuItem
                icon={RefreshArrowsRectangle}
                label={
                  note.repostInfo
                    ? t('notes.detail.undoRepost')
                    : t('notes.detail.repostNote')
                }
                showChevron={false}
                onPress={note.repostInfo ? handleUndoRepost : handleRepost}
              />
            ) : null}
            {showReportRow ? (
              <MenuItem
                icon={FlagReport}
                label={t('notes.detail.reportNote')}
                variant="danger"
                showChevron={false}
                onPress={handleReport}
              />
            ) : null}
          </Menu>
        ) : null}
      </YStack>
    </Screen>
  )
}
