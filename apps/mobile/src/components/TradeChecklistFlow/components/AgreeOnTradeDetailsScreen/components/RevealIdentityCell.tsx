import {useAtomValue, useSetAtom} from 'jotai'
import {
  identityRevealedAtom,
  identityRevealTriggeredFromChatAtom,
  tradeChecklistIdentityDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import ChecklistCell from './ChecklistCell'
import {revealIdentityWithUiFeedbackAtom} from '../../../atoms/revealIdentityAtoms'
import {useMemo} from 'react'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

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
      item={'REVEAL_IDENTITY'}
      onPress={() => {
        void revealIdentity()
      }}
    />
  )
}

export default RevealIdentityCell
