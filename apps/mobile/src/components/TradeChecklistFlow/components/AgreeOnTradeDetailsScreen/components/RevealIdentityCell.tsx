import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, EyeShut} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
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
  const prepareDraft = useSetAtom(prepareExchangeDetailsDraftActionAtom)

  return (
    <ChecklistCell
      icon={EyeShut}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
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
