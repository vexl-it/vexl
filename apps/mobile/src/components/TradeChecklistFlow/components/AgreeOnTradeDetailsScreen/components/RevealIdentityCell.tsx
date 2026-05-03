import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, EyeShut} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {
  identityRevealTriggeredFromChatAtom,
  identityRevealedAtom,
  tradeChecklistIdentityDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {
  prepareRevealIdentityDraftActionAtom,
  shouldOpenRevealIdentitySummaryAtom,
} from '../../../atoms/revealIdentityAtoms'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function RevealIdentityCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
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
  const shouldOpenRevealIdentitySummary = useAtomValue(
    shouldOpenRevealIdentitySummaryAtom
  )
  const prepareRevealIdentityDraft = useSetAtom(
    prepareRevealIdentityDraftActionAtom
  )

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
      icon={EyeShut}
      disabled={disabled}
      state={
        identityRevealed
          ? ('completed' as const)
          : identityRevealTriggeredFromChat
            ? ('pending' as const)
            : mapTradeChecklistItemStatusToUiState(itemStatus)
      }
      pressable
      subtitle={t('tradeChecklist.shareRecognitionSignInChat')}
      onPress={() => {
        prepareRevealIdentityDraft()
        navigation.navigate(
          shouldOpenRevealIdentitySummary
            ? 'RevealIdentitySummary'
            : 'RevealIdentityPhoto'
        )
      }}
      headline={t('tradeChecklist.revealIdentitySimple')}
    />
  )
}

export default RevealIdentityCell
