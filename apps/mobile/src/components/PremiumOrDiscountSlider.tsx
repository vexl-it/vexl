import React from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {iosHapticFeedback} from '../utils/iosHapticFeedback'
import {useTranslation} from '../utils/localization/I18nProvider'
import Slider from './Slider'

export const SLIDER_THRESHOLD = 10

interface Props {
  iAmTheBuyer: boolean
  sliderThreshold: number
  sliderValue: number
  onValueChange: (_: number[]) => void
}

function PremiumOrDiscountSlider({
  iAmTheBuyer,
  sliderThreshold,
  onValueChange,
  sliderValue,
}: Props): React.ReactElement {
  const tokens = getTokens()
  const {t} = useTranslation()

  return (
    <Stack
      p="$4"
      br="$4"
      bc={
        sliderValue === 0
          ? '$grey'
          : Math.abs(sliderValue) > sliderThreshold / 2
            ? '$redAccent1'
            : '$darkBrown'
      }
    >
      <XStack f={1} jc="space-between" mb="$4">
        <Text
          fos={16}
          col={
            sliderValue >= 0
              ? '$white'
              : sliderValue < -sliderThreshold / 2
                ? '$red'
                : '$main'
          }
          numberOfLines={2}
          adjustsFontSizeToFit
          maxWidth="50%"
        >
          {iAmTheBuyer
            ? t('offerForm.premiumOrDiscount.buyCheaply')
            : t('offerForm.premiumOrDiscount.sellFaster')}
        </Text>
        <Text
          col={
            sliderValue <= 0
              ? '$white'
              : sliderValue > sliderThreshold / 2
                ? '$red'
                : '$main'
          }
          numberOfLines={2}
          adjustsFontSizeToFit
          maxWidth="50%"
        >
          {iAmTheBuyer
            ? t('offerForm.premiumOrDiscount.buyFaster')
            : t('offerForm.premiumOrDiscount.earnMore')}
        </Text>
      </XStack>
      <Slider
        customKnobColor={
          Math.abs(sliderValue) <= sliderThreshold / 2 ? '$main' : '$red'
        }
        minimumTrackTintColor={tokens.color.greyOnWhite.val}
        maximumValue={sliderThreshold}
        minimumValue={-sliderThreshold}
        step={1}
        value={sliderValue}
        onValueChange={(value) => {
          if (value[0] !== sliderValue) {
            iosHapticFeedback()
            onValueChange(value)
          }
        }}
      />
    </Stack>
  )
}

export default PremiumOrDiscountSlider
