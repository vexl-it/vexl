import {useFocusEffect} from '@react-navigation/native'
import {YStack} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {iosHapticFeedback} from '../../../../../../utils/iosHapticFeedback'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import PremiumOrDiscountSlider from '../../../../../PremiumOrDiscountSlider'
import {feeAmountAtom} from '../../../../../TradeCalculator/atoms'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  applyFeeOnFeeChangeActionAtom,
  isMineOfferAtom,
  offerTypeAtom,
} from '../../atoms'

const tempFeeAmountAtom = atom<number>(0)

function PremiumOrDiscountScreen(): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const isMineOffer = useAtomValue(isMineOfferAtom)
  const offerType = useAtomValue(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)

  const iAmTheBuyer =
    (offerType === 'BUY' && isMineOffer) ||
    (offerType === 'SELL' && !isMineOffer)

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  const handlePercentageChange = useCallback(
    (percentage: number): void => {
      if (percentage === tempFeeAmount) return

      iosHapticFeedback()
      setTempFeeAmount(percentage)
    },
    [setTempFeeAmount, tempFeeAmount]
  )

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.calculateAmount.premiumOrDiscount'),
      }}
      bottomButton={{
        onPress: () => {
          applyFeeOnFeeChange(tempFeeAmount)
          goBack()
        },
        text: t('common.save'),
        disabled: false,
        variant: 'secondary',
      }}
      scrollable={false}
    >
      <YStack flex={1} pt="$4">
        <PremiumOrDiscountSlider
          feeAmount={tempFeeAmount}
          onFeeAmountChange={handlePercentageChange}
          isBuy={iAmTheBuyer}
        />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default PremiumOrDiscountScreen
