import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {
  identityRevealedAtom,
  identityRevealTriggeredFromChatAtom,
  tradeChecklistDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import ChecklistCell from './ChecklistCell'
import {revealIdentityWithUiFeedbackAtom} from '../../../atoms/revealIdentityAtoms'
import {useMemo} from 'react'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'

function RevealIdentityCell(): JSX.Element {
  const store = useStore()
  const identityRevealed = useAtomValue(identityRevealedAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_IDENTITY'), [])
  )
  const identityRevealTriggeredFromChat = useAtomValue(
    identityRevealTriggeredFromChatAtom
  )
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)

  const disabled = useMemo(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)
    const revealIdentityAlreadySent =
      tradeChecklistData.identity.sent && !tradeChecklistData.identity.received
    const identityRevealDeclined =
      tradeChecklistData.identity.sent && itemStatus === 'declined'

    // eslint-disable-next-line
    return revealIdentityAlreadySent || identityRevealDeclined
  }, [itemStatus, store])

  return (
    <ChecklistCell
      isDisabled={disabled}
      hidden={identityRevealed || identityRevealTriggeredFromChat}
      item={'REVEAL_IDENTITY'}
      onPress={() => {
        void revealIdentity()
      }}
    />
  )
}

export default RevealIdentityCell
