import {ChecklistCell, EyeShut} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {
  identityRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistIdentityDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {revealIdentityWithUiFeedbackAtom} from '../../../atoms/revealIdentityAtoms'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function RevealIdentityCell(): React.ReactElement {
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

  if (identityRevealed || identityRevealTriggeredFromChat) return <></>

  return (
    <ChecklistCell
      icon={EyeShut}
      disabled={disabled}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      subtitle={t('tradeChecklist.shareRecognitionSignInChat')}
      onPress={() => {
        void revealIdentity()()
      }}
      headline="Reveal identity"
    />
  )
}

export default RevealIdentityCell
