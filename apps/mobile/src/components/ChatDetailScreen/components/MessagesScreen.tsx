import {Stack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import * as fromChatAtoms from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {chatMolecule} from '../atoms'
import ChatTextInput from './ChatTextInput'
import ImageZoomOverlay from './ImageZoomOverlay'
import MessagesList from './MessagesList'
import {MessagesScreenChatHeader} from './MessagesScreenChatHeader'
import QuickActionBanner from './QuickActionBanner'
import StickyHeader from './StickyHeader'

function MessagesScreen(): React.ReactElement {
  const {
    showModalAtom,
    canSendMessagesAtom,
    chatIdAtom,
    publicKeyPemBase64Atom,
  } = useMolecule(chatMolecule)
  useStatusBarStyleForScreen('secondary')
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
    <Stack flex={1}>
      <MessagesScreenChatHeader />
      {/* <ChatHeader
        mode={showModal ? 'photoTop' : 'photoLeft'}
        leftButton={showModal ? 'closeModal' : 'back'}
        rightButton={canSendMessages ? 'tradeChecklist' : null}
        onPressMiddle={() => {
          setShowModal((v) => !v)
        }}
      /> */}
      <StickyHeader />
      <Stack f={1}>
        <MessagesList />
        <Stack position="absolute" b={0} l={0} r={0}>
          <QuickActionBanner />
        </Stack>
      </Stack>
      {!!canSendMessages && (
        <Stack>
          <ChatTextInput />
        </Stack>
      )}
      <ImageZoomOverlay />
    </Stack>
  )
}

export default MessagesScreen
