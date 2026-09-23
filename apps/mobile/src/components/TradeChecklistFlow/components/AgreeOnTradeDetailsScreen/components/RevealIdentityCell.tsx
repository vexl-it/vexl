import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, EyeShut} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {canExchangeDetailsAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {prepareExchangeDetailsDraftActionAtom} from '../../../atoms/exchangeDetailsAtoms'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function RevealIdentityCell(): React.ReactElement {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('REVEAL_IDENTITY'), [])
  )
  const canExchangeDetails = useAtomValue(canExchangeDetailsAtom)
  const prepareDraft = useSetAtom(prepareExchangeDetailsDraftActionAtom)

  return (
    <ChecklistCell
      icon={EyeShut}
      disabled={!canExchangeDetails}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable={canExchangeDetails}
      subtitle={t('tradeChecklist.exchangeDetails.checklistSubtitle')}
      onPress={() => {
        prepareDraft()
        navigation.navigate('ExchangeDetails')
      }}
      headline={t('tradeChecklist.exchangeDetails.title')}
    />
  )
}

export default RevealIdentityCell
