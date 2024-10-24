import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Stack} from 'tamagui'
import * as fromChatAtoms from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {chatMolecule} from '../../../atoms'

interface Props {
  children: React.ReactNode
}

function TradeChecklistMessageWrapper({children}: Props): JSX.Element {
  const {chatIdAtom, publicKeyPemBase64Atom} = useMolecule(chatMolecule)

  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const setParentChat = useSetAtom(fromChatAtoms.setParentChatActionAtom)

  // sets parent chat for checklist as user can interact with it directly from chat
  // without going through trade checklist flow
  useEffect(() => {
    setParentChat({chatId, inboxKey})
  }, [chatId, inboxKey, setParentChat])

  return <Stack>{children}</Stack>
}

export default TradeChecklistMessageWrapper
