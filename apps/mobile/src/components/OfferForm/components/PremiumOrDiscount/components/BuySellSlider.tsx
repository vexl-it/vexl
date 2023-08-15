import {getTokens, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ComponentContainer from './ComponentContainer'
import SliderText from './SliderText'
import {type SetStateAction, useAtomValue, type WritableAtom} from 'jotai'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'
import Slider from '../../../../Slider'

export const SLIDER_THRESHOLD = 10

interface Props {
  sliderThreshold: number
  sliderValue: number
  onValueChange: (_: number[]) => void
  offerTypeAtom: WritableAtom<OfferType, [SetStateAction<OfferType>], void>
}

function BuySellSlider({
  sliderThreshold,
  onValueChange,
  sliderValue,
  offerTypeAtom,
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const offerType = useAtomValue(offerTypeAtom)

  return (
    <ComponentContainer
      extremeValue={Math.abs(sliderValue) > sliderThreshold / 2}
      zeroValue={sliderValue === 0}
    >
      <XStack f={1} jc="space-between" mb="$4">
        <SliderText
          extremeValue={sliderValue < -sliderThreshold / 2}
          zeroValue={sliderValue >= 0}
          numberOfLines={2}
          adjustsFontSizeToFit
          maxWidth={'50%'}
        >
          {offerType === 'BUY'
            ? t('offerForm.premiumOrDiscount.buyCheaply')
            : t('offerForm.premiumOrDiscount.sellFaster')}
        </SliderText>
        <SliderText
          extremeValue={sliderValue > sliderThreshold / 2}
          zeroValue={sliderValue <= 0}
          numberOfLines={2}
          adjustsFontSizeToFit
          maxWidth={'50%'}
        >
          {offerType === 'BUY'
            ? t('offerForm.premiumOrDiscount.buyFaster')
            : t('offerForm.premiumOrDiscount.earnMore')}
        </SliderText>
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
        onValueChange={onValueChange}
      />
    </ComponentContainer>
  )
}

export default BuySellSlider
