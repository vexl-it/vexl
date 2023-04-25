import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue} from 'jotai'
import RequestScreen from './RequestScreen'
import MessagesScreen from './MessagesScreen'
import Screen from '../../Screen'
import ChatInfoModal from './ChatInfoModal'
import MarkAsReadWhenRendered from './MarkAsReadWhenRendered'
import KeyboardAvoidingView from '../../KeyboardAvoidingView'

export default function MessagesListOrApprovalPreview(): JSX.Element {
  const {chatUiModeAtom, chatAtom} = useMolecule(chatMolecule)
  const chatUiMode = useAtomValue(chatUiModeAtom)

  let toRender = <></>
  // TODO handle no messages
  if (chatUiMode === 'approval') toRender = <RequestScreen />
  else toRender = <MessagesScreen />

  return (
    <KeyboardAvoidingView>
      <MarkAsReadWhenRendered chatAtom={chatAtom} />
      <Screen>{toRender}</Screen>
      <ChatInfoModal />
    </KeyboardAvoidingView>
  )
}
