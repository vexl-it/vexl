import ChecklistCell from './ChecklistCell'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {revealContactWithUiFeedbackAtom} from '../../../atoms/revealContactAtom'
import {useMemo} from 'react'
import {
  contactRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'

function RevealPhoneNumberCell(): JSX.Element {
  const store = useStore()
  const identityRevealed = useAtomValue(identityRevealedAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_PHONE_NUMBER'), [])
  )
  const contactRevealTriggeredFromChat = useAtomValue(
    contactRevealTriggeredFromChatAtom
  )

  const disabled = useMemo(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)
    const revealContactAlreadySent =
      tradeChecklistData.contact.sent && !tradeChecklistData.contact.received
    const contactRevealDeclined =
      tradeChecklistData.contact.sent && itemStatus === 'declined'

    // eslint-disable-next-line
    return revealContactAlreadySent || contactRevealDeclined
  }, [itemStatus, store])

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
