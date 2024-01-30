import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {
  identityRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistIdentityDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {revealIdentityWithUiFeedbackAtom} from '../../../atoms/revealIdentityAtoms'
import ChecklistCell from './ChecklistCell'

function RevealIdentityCell(): JSX.Element {
  const {t} = useTranslation()
  const identityRevealed = useAtomValue(identityRevealedAtom)
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_IDENTITY'), [])
  )
  const identityRevealTriggeredFromChat = useAtomValue(
    identityRevealTriggeredFromChatAtom
  )
  const tradeChecklistIdentityData = useAtomValue(
    tradeChecklistIdentityDataAtom
  )
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)

  const disabled = useMemo(() => {
    const revealIdentityAlreadySent =
      tradeChecklistIdentityData.sent && !tradeChecklistIdentityData.received
    const identityRevealDeclined =
      tradeChecklistIdentityData.sent && itemStatus === 'declined'

    return Boolean(revealIdentityAlreadySent) || Boolean(identityRevealDeclined)
  }, [
    itemStatus,
    tradeChecklistIdentityData.received,
    tradeChecklistIdentityData.sent,
  ])

  return (
    <ChecklistCell
      isDisabled={disabled}
      hidden={identityRevealed || identityRevealTriggeredFromChat}
      subtitle={t('tradeChecklist.shareRecognitionSignInChat')}
      item="REVEAL_IDENTITY"
      onPress={() => {
        void revealIdentity()()
      }}
    />
  )
}

export default RevealIdentityCell
