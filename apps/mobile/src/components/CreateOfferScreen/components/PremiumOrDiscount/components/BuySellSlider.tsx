import Slider from '../../Slider'
import {getTokens, XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ComponentContainer from './ComponentContainer'
import SliderText from './SliderText'
import {useAtomValue} from 'jotai'
import {offerTypeAtom} from '../../../state/atom'

interface Props {
  sliderThreshold: number
  sliderValue: number
  onValueChange: (_: number[]) => void
}

function BuySellSlider({
  sliderThreshold,
  onValueChange,
  sliderValue,
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const offerType = useAtomValue(offerTypeAtom)

  return (
    <ComponentContainer
      extremeValue={Math.abs(sliderValue) > sliderThreshold / 2}
      zeroValue={sliderValue === 0}
    >
      <XStack jc="space-between" mb="$4">
        <SliderText
          extremeValue={sliderValue < -sliderThreshold / 2}
          zeroValue={sliderValue >= 0}
        >
          {offerType === 'BUY'
            ? t('createOffer.premiumOrDiscount.buyCheaply')
            : t('createOffer.premiumOrDiscount.sellFaster')}
        </SliderText>
        <SliderText
          extremeValue={sliderValue > sliderThreshold / 2}
          zeroValue={sliderValue <= 0}
        >
          {offerType === 'BUY'
            ? t('createOffer.premiumOrDiscount.buyFaster')
            : t('createOffer.premiumOrDiscount.earnMore')}
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
