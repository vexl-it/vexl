import ChecklistCell from './ChecklistCell'
import {useAtomValue, useSetAtom} from 'jotai'
import {revealContactWithUiFeedbackAtom} from '../../../atoms/revealContactAtom'
import {useMemo} from 'react'
import {
  contactRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistContactDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'

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

    // eslint-disable-next-line
    return revealContactAlreadySent || contactRevealDeclined
  }, [
    itemStatus,
    tradeChecklistContactData.received,
    tradeChecklistContactData.sent,
  ])

  return (
    <ChecklistCell
      isDisabled={disabled}
      hidden={!identityRevealed || contactRevealTriggeredFromChat}
      item={'REVEAL_PHONE_NUMBER'}
      onPress={() => {
        void revealContact()
      }}
    />
  )
}

export default RevealPhoneNumberCell
