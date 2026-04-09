import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React from 'react'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistAmountSuggestionView(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {chatIdAtom, publicKeyPemBase64Atom, tradeChecklistAmountAtom} =
    useMolecule(chatMolecule)
  const amountData = useAtomValue(tradeChecklistAmountAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const amountPending = amount.amountPending(amountData)

  if (amountPending) return null

  return (
    <VexlbotActionCard
      buttonText={t('tradeChecklist.options.CALCULATE_AMOUNT')}
      description={t('vexlbot.agreeOnPreferredAmount')}
      onPress={() => {
        navigation.navigate('TradeChecklistFlow', {
          screen: 'CalculateAmount',
          chatId,
          inboxKey,
          params: {
            amountData: undefined,
          },
        })
      }}
      title={t('tradeChecklist.options.CALCULATE_AMOUNT')}
    />
  )
}

export default TradeChecklistAmountSuggestionView
