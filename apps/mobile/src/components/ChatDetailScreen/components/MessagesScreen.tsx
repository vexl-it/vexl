import {KeyboardAvoidingView, Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import * as fromChatAtoms from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useAppState} from '../../../utils/useAppState'
import Screen from '../../Screen'
import {chatMolecule} from '../atoms'
import {ChatActionButtons} from './ChatActionButtons'
import ChatTextInput from './ChatTextInput'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import MessagesList from './MessagesList'
import {MessagesScreenChatHeader} from './MessagesScreenChatHeader'
import StickyHeader from './StickyHeader'

function MessagesScreen(): React.ReactElement {
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
  // without going through trade checklist flow
  useEffect(() => {
    setParentChat({chatId, inboxKey})
  }, [chatId, inboxKey, setParentChat])

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
        insetsColor="$backgroundSecondary"
        backgroundColor="$backgroundPrimary"
      >
        <KeyboardAvoidingView>
          <Stack flex={1}>
            <MessagesScreenChatHeader />
            <StickyHeader />
            <Stack f={1}>
              <MessagesList />
            </Stack>
            {canSendMessages ? (
              <Stack>
                <ChatTextInput />
              </Stack>
            ) : (
              <ChatActionButtons />
            )}
          </Stack>
        </KeyboardAvoidingView>
      </Screen>
    </>
  )
}

export default MessagesScreen
