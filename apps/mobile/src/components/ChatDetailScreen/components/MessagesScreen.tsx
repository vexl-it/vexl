import {useFocusEffect} from '@react-navigation/native'
import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {Screen, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {KeyboardController} from 'react-native-keyboard-controller'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import * as fromChatAtoms from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useAppState} from '../../../utils/useAppState'
import {chatMolecule} from '../atoms'
import {ChatActionButtons} from './ChatActionButtons'
import ChatTextInput from './ChatTextInput'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import MessageActionsOverlay from './MessageActionsOverlay'
import MessagesList from './MessagesList'
import {MessagesScreenChatHeader} from './MessagesScreenChatHeader'
import StickyHeader from './StickyHeader'

function MessagesScreen({
  targetMessageId,
}: {
  targetMessageId?: ChatMessageId | undefined
}): React.ReactElement {
  const {canSendMessagesAtom, chatIdAtom, publicKeyPemBase64Atom} =
    useMolecule(chatMolecule)
  useStatusBarStyleForScreen('secondary')
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const setParentChat = useSetAtom(fromChatAtoms.setParentChatActionAtom)
  const fetchAndStoreMessagesForInbox = useSetAtom(
    fetchAndStoreMessagesForInboxHandleNotificationsActionAtom
  )
  // sets parent chat for checklist as user can interact with it directly from chat
  // without going through trade checklist flow; focus restores it after another chat.
  useFocusEffect(
    useCallback(() => {
      setParentChat({chatId, inboxKey})
    }, [chatId, inboxKey, setParentChat])
  )

  // The message list only makes room for the keyboard when it sees it open,
  // so it must not stay open across entering or leaving the chat.
  useFocusEffect(
    useCallback(() => {
      void KeyboardController.dismiss()
      return () => {
        void KeyboardController.dismiss()
      }
    }, [])
  )

  useAppState(
    useCallback(() => {
      fetchAndStoreMessagesForInbox({
        key: inboxKey,
      }).pipe(Effect.runFork)
    }, [fetchAndStoreMessagesForInbox, inboxKey])
  )

  return (
    <>
      <MarkAsReadWhenRendered />
      <Screen
        safeAreasBackgroundColor="$backgroundSecondary"
        navigationBar={null}
        noHorizontalPadding
        footer={canSendMessages ? <ChatTextInput /> : <ChatActionButtons />}
        footerSitsOnKeyboard
        footerFrameProps={{
          backgroundColor: '$backgroundSecondary',
          paddingHorizontal: 0,
          paddingTop: 0,
        }}
      >
        <Stack flex={1}>
          <MessagesScreenChatHeader />
          <StickyHeader />
          <Stack f={1}>
            <MessagesList targetMessageId={targetMessageId} />
          </Stack>
        </Stack>
      </Screen>
      <MessageActionsOverlay />
    </>
  )
}

export default MessagesScreen
