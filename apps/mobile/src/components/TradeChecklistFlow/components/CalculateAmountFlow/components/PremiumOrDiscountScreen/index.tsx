import {useFocusEffect} from '@react-navigation/native'
import {BuySellRangeSlider, Typography, XStack, YStack} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {iosHapticFeedback} from '../../../../../../utils/iosHapticFeedback'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {
  getInfoText,
  SLIDER_THRESHOLD,
} from '../../../../../../utils/premiumOrDiscount'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
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

  const priceLabel =
    tempFeeAmount === 0
      ? t('offerForm.premiumOrDiscount.marketPrice')
      : `${tempFeeAmount > 0 ? '+' : '-'} ${Math.abs(tempFeeAmount)} %`
  const leftLabel = iAmTheBuyer
    ? t('offerForm.premiumOrDiscount.buyCheaply')
    : t('offerForm.premiumOrDiscount.sellFaster')
  const rightLabel = iAmTheBuyer
    ? t('offerForm.premiumOrDiscount.buyFaster')
    : t('offerForm.premiumOrDiscount.earnMore')

  const infoMessage = getInfoText(tempFeeAmount, iAmTheBuyer, t)
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
      <YStack flex={1} gap="$7" pt="$4">
        <XStack alignItems="center" justifyContent="space-between" gap="$4">
          <Typography variant="titlesSmall" color="$foregroundPrimary" flex={1}>
            {iAmTheBuyer
              ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
              : t('offerForm.premiumOrDiscount.youSellBtcFor')}
          </Typography>
          <XStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            px="$4"
            py="$3"
          >
            <Typography
              variant="descriptionBold"
              color={
                tempFeeAmount === 0
                  ? '$foregroundPrimary'
                  : '$accentHighlightSecondary'
              }
            >
              {priceLabel}
            </Typography>
          </XStack>
        </XStack>
        <BuySellRangeSlider
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          minPercentage={-SLIDER_THRESHOLD}
          maxPercentage={SLIDER_THRESHOLD}
          percentage={tempFeeAmount}
          onPercentageChange={handlePercentageChange}
          infoText={infoMessage}
          amountText=""
        />
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default PremiumOrDiscountScreen
