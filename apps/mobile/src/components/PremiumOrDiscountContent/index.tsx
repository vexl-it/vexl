import {useAtom, type SetStateAction, type WritableAtom} from 'jotai'
import {type ReactNode} from 'react'
import {TouchableOpacity} from 'react-native'
import {Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import PremiumOrDiscountSlider, {
  SLIDER_THRESHOLD,
} from '../PremiumOrDiscountSlider'
import Info from './components/Info'

interface CommonProps {
  children: ReactNode
  feeAmountAtom: WritableAtom<number, [SetStateAction<number>], void>
  iAmTheBuyer: boolean
}

type OptionalProps =
  | {
      proceedToDetailDisabled: true
      onProceedToDetailPress?: undefined
    }
  | {
      proceedToDetailDisabled?: false
      onProceedToDetailPress: () => void
    }

type Props = OptionalProps & CommonProps

function PremiumOrDiscountContent({
  children,
  iAmTheBuyer,
  feeAmountAtom,
  proceedToDetailDisabled,
  onProceedToDetailPress,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)

  const onSliderValueChange = (value: number[]): void => {
    setFeeAmount(value[0] ?? 0)
  }

  return (
    <YStack space="$2">
      <XStack f={1} ai="center" jc="space-between">
        <Text maxWidth="50%" mr="$4" fos={18} ff="$body600" col="$white">
          {iAmTheBuyer
            ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
            : t('offerForm.premiumOrDiscount.youSellBtcFor')}
        </Text>
        <TouchableOpacity
          disabled={proceedToDetailDisabled}
          style={{flex: 1}}
          onPress={onProceedToDetailPress}
        >
          <XStack f={1} ai="center" jc="center" bc="$grey" br="$4" p="$4">
            {children}
            {feeAmount !== 0 && (
              <Text
                fos={18}
                ff="$body600"
                col={
                  feeAmount === 0
                    ? '$greyOnBlack'
                    : Math.abs(feeAmount) > SLIDER_THRESHOLD / 2
                      ? '$red'
                      : '$main'
                }
              >
                {`${feeAmount > 0 ? '+' : '-'} ${Math.abs(feeAmount)} %`}
              </Text>
            )}
          </XStack>
        </TouchableOpacity>
      </XStack>
      <PremiumOrDiscountSlider
        iAmTheBuyer={iAmTheBuyer}
        sliderThreshold={SLIDER_THRESHOLD}
        sliderValue={feeAmount}
        onValueChange={onSliderValueChange}
      />
      <Info
        feeAmountAtom={feeAmountAtom}
        iAmTheBuyer={iAmTheBuyer}
        sliderThreshold={SLIDER_THRESHOLD}
      />
    </YStack>
  )
}

export default PremiumOrDiscountContent
