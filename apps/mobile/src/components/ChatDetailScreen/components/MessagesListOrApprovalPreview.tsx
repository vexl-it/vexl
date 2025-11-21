import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect} from 'react'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useAppState} from '../../../utils/useAppState'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'
import Screen from '../../Screen'
import {chatMolecule} from '../atoms'
import ChatInfoModal from './ChatInfoModal'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import MessagesScreen from './MessagesScreen'
import RequestScreen from './RequestScreen'

export default function MessagesListOrApprovalPreview(): React.ReactElement {
  const {chatUiModeAtom, chatAtom, publicKeyPemBase64Atom} =
    useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)
  const fetchAndStoreMessagesForInbox = useSetAtom(
    fetchAndStoreMessagesForInboxHandleNotificationsActionAtom
  )
  const publicKeyPemBase64 = useAtomValue(publicKeyPemBase64Atom)
  const {tradeChecklistPickAtom, syncTradeReminderActionAtom} =
    useMolecule(chatMolecule)
  const tradeChecklistPick = useAtomValue(tradeChecklistPickAtom)
  const syncTradeReminder = useSetAtom(syncTradeReminderActionAtom)

  useAppState(
    useCallback(() => {
      fetchAndStoreMessagesForInbox({
        key: publicKeyPemBase64,
      }).pipe(Effect.runFork)
    }, [fetchAndStoreMessagesForInbox, publicKeyPemBase64])
  )

  useEffect(() => {
    void syncTradeReminder(tradeChecklistPick)
  }, [syncTradeReminder, tradeChecklistPick])

  const toRender =
    chatUiMode === 'approval' ? (
      <RequestScreen />
    ) : (
      <KeyboardAvoidingView>
        <MessagesScreen />
      </KeyboardAvoidingView>
    )

  return (
    <>
      <MarkAsReadWhenRendered chatAtom={chatAtom} />
      <Screen>{toRender}</Screen>
      <ChatInfoModal />
    </>
  )
}
