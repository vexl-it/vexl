import {useNavigation} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import * as amount from '../../../../../state/tradeChecklist/utils/amount'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {chatMolecule} from '../../../atoms'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistAmountSuggestionView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {chatIdAtom, publicKeyPemBase64Atom, tradeChecklistAmountAtom} =
    useMolecule(chatMolecule)
  const amountData = useAtomValue(tradeChecklistAmountAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const agreedOnAmount = amount.amountSettled(amountData)
  const amountPending = amount.amountPending(amountData)

  if (amountPending || agreedOnAmount) return null

  return (
    <VexlbotBubble text={t('vexlbot.agreeOnPreferredAmount')}>
      <Button
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'CalculateAmount',
            chatId,
            inboxKey,
            params: {
              amountData: undefined,
              navigateBackToChatOnSave: true,
            },
          })
        }}
        size="medium"
        variant="secondary"
        text={t('tradeChecklist.options.CALCULATE_AMOUNT')}
      />
    </VexlbotBubble>
  )
}

export default TradeChecklistAmountSuggestionView
