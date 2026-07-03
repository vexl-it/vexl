import {useNavigation} from '@react-navigation/native'
import {
  Button,
  FlagReport,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, Stack, useTheme} from 'tamagui'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {reportNoteWithPromptActionAtom} from '../../../state/notes/atoms/reportNoteActionAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import {NotePreview} from '../../Notes/NotePreview'
import {chatMolecule} from '../atoms'

export default function ChatNoteDetailContent({
  chatExists,
}: {
  chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('primary')
  const navigation = useNavigation()
  const theme = useTheme()
  const {bottom} = useSafeAreaInsets()
  const {t} = useTranslation()
  const reportNoteWithPrompt = useSetAtom(reportNoteWithPromptActionAtom)
  const {
    chatAtom,
    commonConnectionsHashesAtom,
    noteForChatAtom,
    otherSideClubsIdsAtom,
    verifiedConnectionsHashesAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const note = useAtomValue(noteForChatAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
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
        <YStack flex={1} justifyContent="center" gap="$5">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="paragraph"
          >
            {t('notes.detail.noteNotFound')}
          </Typography>
          <Button
            onPress={() => {
              navigation.goBack()
            }}
          >
            {t('common.back')}
          </Button>
        </YStack>
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
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottom + getTokens().space.$8.val,
        }}
      >
        <YStack gap="$5">
          <NotePreview note={note} />

          <CommonFriends
            commonConnectionsHashes={commonConnectionsHashes}
            verifiedConnectionsHashes={verifiedConnectionsHashes}
            otherSideClubs={otherSideClubs}
          />

          {theirNoteAndNotReported ? (
            <Stack position="relative">
              <Button
                backgroundColor="$backgroundSecondary"
                onPress={() => {
                  void Effect.runPromise(
                    reportNoteWithPrompt({noteId: note.noteInfo.noteId})
                  ).then((reported) => {
                    if (reported) navigation.goBack()
                  })
                }}
              >
                {' '}
              </Button>
              <XStack
                alignItems="center"
                gap="$3"
                position="absolute"
                top={0}
                right="$5"
                bottom={0}
                left="$5"
                pointerEvents="none"
              >
                <FlagReport
                  color={theme.redForeground.get()}
                  size={getTokens().size.$7.val}
                />
                <Typography color="$redForeground" variant="paragraph">
                  {t('notes.detail.reportNote')}
                </Typography>
              </XStack>
            </Stack>
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  )
}
