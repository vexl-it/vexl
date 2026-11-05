import {useNavigation} from '@react-navigation/native'
import {
  EmptyState,
  FlagReport,
  MenuItem,
  NavigationBar,
  Screen,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {reportNoteWithPromptActionAtom} from '../../../state/notes/atoms/reportNoteActionAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import {NotePreview} from '../../Notes/NotePreview'
import {chatMolecule} from '../atoms'
import {useCommonFriendsOtherSide} from '../utils/useCommonFriendsOtherSide'

export default function ChatNoteDetailContent({
  chatExists,
}: {
  chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('primary')
  const navigation = useNavigation()
  const {t} = useTranslation()
  const otherSide = useCommonFriendsOtherSide()
  const reportNoteWithPrompt = useSetAtom(reportNoteWithPromptActionAtom)
  const {
    chatAtom,
    commonConnectionsHashesAtom,
    friendLevelInfoAtom,
    isMyChatOriginAtom,
    noteForChatAtom,
    otherSideClubsIdsAtom,
    verifiedConnectionsHashesAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const note = useAtomValue(noteForChatAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const friendLevel = useAtomValue(friendLevelInfoAtom)
  const isMine = useAtomValue(isMyChatOriginAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])

  const theirNoteAndNotReported =
    chat.origin.type === 'theirNote' && !note?.flags.reported

  if (!chatExists || !note) {
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('notes.detail.title')}
            rightActions={[
              {
                icon: XmarkCancelClose,
                onPress: () => {
                  navigation.goBack()
                },
              },
            ]}
          />
        }
      >
        <EmptyState
          fullscreen
          title={t('notes.detail.noteNotFound')}
          action={{
            label: t('common.back'),
            onPress: () => {
              navigation.goBack()
            },
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('notes.chat.noteDetail')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: () => {
                navigation.goBack()
              },
            },
          ]}
        />
      }
      scrollable
    >
      <YStack gap="$5" pb="$8">
        <NotePreview note={note} />

        <CommonFriends
          commonConnectionsHashes={commonConnectionsHashes}
          verifiedConnectionsHashes={verifiedConnectionsHashes}
          otherSideClubs={otherSideClubs}
          friendLevel={friendLevel}
          isMine={isMine}
          otherSide={otherSide}
        />

        {theirNoteAndNotReported ? (
          <MenuItem
            icon={FlagReport}
            variant="danger"
            showChevron={false}
            label={t('notes.detail.reportNote')}
            onPress={() => {
              void Effect.runPromise(
                reportNoteWithPrompt({noteId: note.noteInfo.noteId})
              ).then((reported) => {
                if (reported) navigation.goBack()
              })
            }}
          />
        ) : null}
      </YStack>
    </Screen>
  )
}
