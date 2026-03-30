import {CellPhoneMobileDevice, ChecklistCell} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {
  contactRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistContactDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {revealContactWithUiFeedbackAtom} from '../../../atoms/revealContactAtoms'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function RevealPhoneNumberCell(): React.ReactElement {
  const identityRevealed = useAtomValue(identityRevealedAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_PHONE_NUMBER'), [])
  )
  const tradeChecklistContactData = useAtomValue(tradeChecklistContactDataAtom)
  const contactRevealTriggeredFromChat = useAtomValue(
    contactRevealTriggeredFromChatAtom
  )

  const disabled = useMemo(() => {
    const revealContactAlreadySent =
      tradeChecklistContactData.sent && !tradeChecklistContactData.received
    const contactRevealDeclined =
      tradeChecklistContactData.sent && itemStatus === 'declined'

    return Boolean(revealContactAlreadySent) || Boolean(contactRevealDeclined)
  }, [
    itemStatus,
    tradeChecklistContactData.received,
    tradeChecklistContactData.sent,
  ])

  if (!identityRevealed || contactRevealTriggeredFromChat) return <></>

  return (
    <ChecklistCell
      icon={CellPhoneMobileDevice}
      disabled={disabled}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      onPress={() => {
        void revealContact()()
      }}
      headline="Reveal phone number"
    />
  )
}

export default RevealPhoneNumberCell
