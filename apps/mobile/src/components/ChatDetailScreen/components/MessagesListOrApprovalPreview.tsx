import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
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
  const {chatUiModeAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)
  const fetchAndStoreMessagesForInbox = useSetAtom(
    fetchAndStoreMessagesForInboxHandleNotificationsActionAtom
  )
  const publicKeyPemBase64 = useAtomValue(publicKeyPemBase64Atom)

  useAppState(
    useCallback(() => {
      fetchAndStoreMessagesForInbox({
        key: publicKeyPemBase64,
      }).pipe(Effect.runFork)
    }, [fetchAndStoreMessagesForInbox, publicKeyPemBase64])
  )

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
      <MarkAsReadWhenRendered />
      <Screen>{toRender}</Screen>
      <ChatInfoModal />
    </>
  )
}
