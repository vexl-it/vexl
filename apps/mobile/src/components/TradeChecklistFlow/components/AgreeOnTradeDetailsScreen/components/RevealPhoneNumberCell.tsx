import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {
  contactRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistContactDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {revealContactWithUiFeedbackAtom} from '../../../atoms/revealContactAtoms'
import ChecklistCell from './ChecklistCell'

function RevealPhoneNumberCell(): JSX.Element {
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

  return (
    <ChecklistCell
      isDisabled={disabled}
      hidden={!identityRevealed || contactRevealTriggeredFromChat}
      item="REVEAL_PHONE_NUMBER"
      onPress={() => {
        void revealContact()()
      }}
    />
  )
}

export default RevealPhoneNumberCell
