import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useStore} from 'jotai'
import RequestScreen from './RequestScreen'
import MessagesScreen from './MessagesScreen'
import Screen from '../../Screen'
import ChatInfoModal from './ChatInfoModal'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import {useFetchAndStoreMessagesForInbox} from '../../../state/chat/hooks/useFetchNewMessages'
import {useAppState} from '../../../utils/useAppState'
import {useCallback} from 'react'

export default function MessagesListOrApprovalPreview(): JSX.Element {
  const {chatUiModeAtom, chatAtom} = useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)
  const store = useStore()
  const refreshMessages = useFetchAndStoreMessagesForInbox()

  useAppState(
    useCallback(() => {
      void refreshMessages(
        store.get(chatAtom).inbox.privateKey.publicKeyPemBase64
      )()
    }, [refreshMessages, store, chatAtom])
  )

  const toRender =
    chatUiMode === 'approval' ? <RequestScreen /> : <MessagesScreen />

  return (
    <>
      <MarkAsReadWhenRendered chatAtom={chatAtom} />
      <Screen>{toRender}</Screen>
      <ChatInfoModal />
    </>
  )
}
