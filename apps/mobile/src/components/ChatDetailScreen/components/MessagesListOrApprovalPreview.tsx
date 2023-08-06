import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import RequestScreen from './RequestScreen'
import MessagesScreen from './MessagesScreen'
import Screen from '../../Screen'
import ChatInfoModal from './ChatInfoModal'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import {useAppState} from '../../../utils/useAppState'
import {useCallback} from 'react'
import {fetchAndStoreMessagesForInboxAtom} from '../../../state/chat/hooks/useFetchNewMessages'

export default function MessagesListOrApprovalPreview(): JSX.Element {
  const {chatUiModeAtom, chatAtom} = useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)
  const fetchAndStoreMessagesForInbox = useSetAtom(
    fetchAndStoreMessagesForInboxAtom
  )
  const chat = useAtomValue(chatAtom)

  useAppState(
    useCallback(() => {
      void fetchAndStoreMessagesForInbox({
        key: chat.inbox.privateKey.publicKeyPemBase64,
      })
    }, [
      chat.inbox.privateKey.publicKeyPemBase64,
      fetchAndStoreMessagesForInbox,
    ])
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
