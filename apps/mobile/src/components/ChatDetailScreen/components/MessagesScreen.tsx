import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack} from 'tamagui'
import * as fromChatAtoms from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {chatMolecule} from '../atoms'
import ChatHeader from './ChatHeader'
import ChatTextInput from './ChatTextInput'
import ImageZoomOverlay from './ImageZoomOverlay'
import MessagesList from './MessagesList'
import QuickActionBanner from './QuickActionBanner'
import StickyHeader from './StickyHeader'

function MessagesScreen(): JSX.Element {
  const {
    showModalAtom,
    canSendMessagesAtom,
    chatIdAtom,
    publicKeyPemBase64Atom,
  } = useMolecule(chatMolecule)
  const [showModal, setShowModal] = useAtom(showModalAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const setParentChat = useSetAtom(fromChatAtoms.setParentChatActionAtom)

  // sets parent chat for checklist as user can interact with it directly from chat
  // without going through trade checklist flow
  useEffect(() => {
    setParentChat({chatId, inboxKey})
  }, [chatId, inboxKey, setParentChat])

  return (
    <>
      <ChatHeader
        mode={showModal ? 'photoTop' : 'photoLeft'}
        leftButton={showModal ? 'closeModal' : 'back'}
        rightButton={canSendMessages ? 'tradeChecklist' : null}
        onPressMiddle={() => {
          setShowModal((v) => !v)
        }}
      />
      <StickyHeader />
      <Stack f={1}>
        <MessagesList />
        <Stack position="absolute" b={0} l={0} r={0}>
          <QuickActionBanner />
        </Stack>
      </Stack>
      {!!canSendMessages && (
        <Stack mx="$4" mb="$2">
          <ChatTextInput />
        </Stack>
      )}
      <ImageZoomOverlay />
    </>
  )
}

export default MessagesScreen
