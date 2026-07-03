import {CommonActions} from '@react-navigation/native'
import {NOTE_TEXT_MAX_LENGTH} from '@vexl-next/domain/src/general/notes'
import {
  Button,
  ChevronLeft,
  InfoBox,
  LabeledTextArea,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useMemo, useState} from 'react'
import {Alert} from 'react-native'
import {type RootStackScreenProps} from '../../navigationTypes'
import idsOfRespondedNotesAtom from '../../state/chat/atoms/idsOfRespondedNotesAtom'
import {sendRequestForNoteHandleUIActionAtom} from '../../state/chat/atoms/sendRequestForNoteActionAtom'
import {singleNoteAtom} from '../../state/notes/atoms/notesState'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {NotePreview} from '../Notes/NotePreview'

type Props = RootStackScreenProps<'SendMessageToNote'>

export default function SendMessageToNoteScreen({
  route: {
    params: {noteId},
  },
  navigation,
}: Props): React.JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const store = useStore()

  const note = useAtomValue(useMemo(() => singleNoteAtom(noteId), [noteId]))
  const respondedNoteIds = useAtomValue(idsOfRespondedNotesAtom)
  const submitRequest = useSetAtom(sendRequestForNoteHandleUIActionAtom)

  const [text, setText] = useState('')

  const alreadyResponded = Array.contains(respondedNoteIds, noteId)
  const trimmedText = text.trim()
  const canSend = trimmedText.length > 0 && !alreadyResponded

  const handleClose = useCallback(() => {
    navigation.popToTop()
  }, [navigation])

  const openChatDetailReplacingFlow = useCallback(
    (params: RootStackScreenProps<'ChatDetail'>['route']['params']) => {
      navigation.dispatch((state) => {
        const routesWithoutSendMessage = Array.dropRight(state.routes, 1)
        const previousRoute =
          routesWithoutSendMessage[routesWithoutSendMessage.length - 1]
        const routesToKeep =
          previousRoute?.name === 'NoteDetail'
            ? Array.dropRight(routesWithoutSendMessage, 1)
            : routesWithoutSendMessage

        return CommonActions.reset({
          ...state,
          routes: [...routesToKeep, {name: 'ChatDetail', params}],
          index: routesToKeep.length,
        })
      })
    },
    [navigation]
  )

  const handleSend = useCallback(() => {
    const currentNote = store.get(singleNoteAtom(noteId))
    if (!trimmedText || !currentNote || alreadyResponded) return

    void Effect.runPromise(
      Effect.gen(function* (_) {
        const chat = yield* _(
          submitRequest({text: trimmedText, note: currentNote})
        )

        openChatDetailReplacingFlow({
          otherSideKey: chat.otherSide.publicKey,
          inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
        })
      }).pipe(
        Effect.catchAll((e) => {
          if (e._tag === 'ReceiverInboxDoesNotExistError') {
            Alert.alert(t('common.error'), t('offer.offerNotFound'), [
              {text: t('common.close')},
            ])
            return Effect.void
          }

          Alert.alert(t('common.error'), t('common.unknownError'), [
            {text: t('common.close'), onPress: handleClose},
          ])
          return Effect.void
        })
      )
    )
  }, [
    store,
    noteId,
    trimmedText,
    alreadyResponded,
    submitRequest,
    openChatDetailReplacingFlow,
    t,
    handleClose,
  ])

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('notes.sendMessage.title')}
      leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
      rightActions={[{icon: XmarkCancelClose, onPress: handleClose}]}
    />
  )

  if (!note) {
    return (
      <Screen navigationBar={navigationBar}>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$5">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('offer.offerNotFound')}
          </Typography>
          <Button variant="primary" onPress={safeGoBack} width="100%">
            {t('common.back')}
          </Button>
        </YStack>
      </Screen>
    )
  }

  return (
    <Screen
      scrollable
      navigationBar={navigationBar}
      footer={
        <YStack gap="$4">
          {alreadyResponded ? (
            <InfoBox variant="naked">
              {t('notes.sendMessage.alreadyResponded')}
            </InfoBox>
          ) : null}
          <Button
            variant={canSend ? 'primary' : 'disabled'}
            disabled={!canSend}
            onPress={handleSend}
          >
            {t('notes.sendMessage.send')}
          </Button>
        </YStack>
      }
    >
      <YStack gap="$6" paddingTop="$4">
        <NotePreview note={note} />

        <LabeledTextArea
          label={t('notes.sendMessage.yourResponse')}
          value={text}
          onChangeText={setText}
          placeholder={t('notes.sendMessage.placeholder')}
          maxLength={NOTE_TEXT_MAX_LENGTH}
        />
      </YStack>
    </Screen>
  )
}
