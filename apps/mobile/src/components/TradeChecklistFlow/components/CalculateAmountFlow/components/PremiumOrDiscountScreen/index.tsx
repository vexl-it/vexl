import {Slider as RNSlider} from '@miblanchard/react-native-slider'
import {useFocusEffect} from '@react-navigation/native'
import {InfoCircle, Typography, lightTheme, tokens} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, XStack, YStack} from 'tamagui'
import {iosHapticFeedback} from '../../../../../../utils/iosHapticFeedback'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {SLIDER_THRESHOLD} from '../../../../../PremiumOrDiscountSlider'
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

  let infoMessage = ''

  if (iAmTheBuyer) {
    if (tempFeeAmount === 0) {
      infoMessage = t(
        'offerForm.premiumOrDiscount.youBuyForTheActualMarketPrice'
      )
    } else if (tempFeeAmount > 0) {
      infoMessage =
        tempFeeAmount <= SLIDER_THRESHOLD / 2
          ? t('offerForm.premiumOrDiscount.theOptimalPositionForMostPeople')
          : t('offerForm.premiumOrDiscount.youBuyReallyFast')
    } else {
      infoMessage =
        Math.abs(tempFeeAmount) <= SLIDER_THRESHOLD / 2
          ? t('offerForm.premiumOrDiscount.youBuyPrettyCheap')
          : t('offerForm.premiumOrDiscount.youBuyVeryCheaply')
    }
  } else {
    if (tempFeeAmount === 0) {
      infoMessage = t(
        'offerForm.premiumOrDiscount.youSellForTheActualMarketPrice'
      )
    } else if (tempFeeAmount > 0) {
      infoMessage =
        tempFeeAmount <= SLIDER_THRESHOLD / 2
          ? t('offerForm.premiumOrDiscount.youEarnBitMore')
          : t('offerForm.premiumOrDiscount.youEarnSoMuchMore')
    } else {
      infoMessage =
        Math.abs(tempFeeAmount) <= SLIDER_THRESHOLD / 2
          ? t('offerForm.premiumOrDiscount.youSellSlightlyFaster')
          : t('offerForm.premiumOrDiscount.youSellMuchFaster')
    }
  }

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
          <Stack
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
          </Stack>
        </XStack>
        <YStack gap="$4">
          <XStack alignItems="flex-start" gap="$4">
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              flex={1}
              numberOfLines={2}
            >
              {leftLabel}
            </Typography>
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              flex={1}
              textAlign="right"
              numberOfLines={2}
            >
              {rightLabel}
            </Typography>
          </XStack>
          <Stack px="$2">
            <RNSlider
              trackClickable
              maximumTrackTintColor={lightTheme.backgroundHighlight}
              maximumValue={SLIDER_THRESHOLD}
              minimumTrackTintColor={lightTheme.backgroundHighlight}
              minimumValue={-SLIDER_THRESHOLD}
              step={1}
              thumbTouchSize={{
                width: tokens.size[12].val,
                height: tokens.size[12].val,
              }}
              trackStyle={{
                height: tokens.space[1].val,
                borderRadius: tokens.radius[8].val,
              }}
              value={tempFeeAmount}
              renderThumbComponent={() => (
                <Stack
                  width={tokens.size[8].val}
                  height={tokens.size[8].val}
                  borderRadius={tokens.radius[8].val}
                  backgroundColor={lightTheme.backgroundPrimary}
                  borderWidth={tokens.space[1].val}
                  borderColor={lightTheme.accentYellowPrimary}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Stack
                    width={tokens.size[5].val}
                    height={tokens.size[5].val}
                    borderRadius={tokens.radius[7].val}
                    backgroundColor={lightTheme.accentYellowPrimary}
                  />
                </Stack>
              )}
              onValueChange={(value) => {
                const nextValue = value[0] ?? 0

                if (nextValue !== tempFeeAmount) {
                  iosHapticFeedback()
                  setTempFeeAmount(nextValue)
                }
              }}
            />
          </Stack>
        </YStack>
        <XStack
          alignItems="flex-start"
          gap="$3"
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          p="$5"
        >
          <Stack pt="$0.5">
            <InfoCircle size={18} color={lightTheme.foregroundSecondary} />
          </Stack>
          <Typography
            variant="description"
            color="$foregroundSecondary"
            flex={1}
          >
            {infoMessage}
          </Typography>
        </XStack>
      </YStack>
    </TradeChecklistItemPageLayout>
  )
}

export default PremiumOrDiscountScreen
