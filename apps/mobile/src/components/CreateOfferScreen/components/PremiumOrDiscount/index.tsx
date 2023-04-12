import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../../Image'
import percentageSvg from './images/percentageSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import {TouchableOpacity} from 'react-native'
import Info from './components/Info'
import BuySellSlider from './components/BuySellSlider'
import SliderText from './components/SliderText'
import {useAtom, useAtomValue} from 'jotai'
import {feeAmountAtom, feeStateAtom, offerTypeAtom} from '../../state/atom'

const SLIDER_THRESHOLD = 10

function PremiumOrDiscount(): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const offerType = useAtomValue(offerTypeAtom)
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)
  const [feeState, setFeeState] = useAtom(feeStateAtom)

  const onSliderValueChange = (value: number[]): void => {
    setFeeAmount(value[0])
  }

  const onSwitchValueChange = (): void => {
    if (feeState === 'WITH_FEE') {
      setFeeAmount(0)
    }
    setFeeState(feeState === 'WITHOUT_FEE' ? 'WITH_FEE' : 'WITHOUT_FEE')
  }

  return (
    <YStack>
      <XStack ai="center" jc="space-between" py="$4">
        <XStack ai="center">
          <Stack mr="$2">
            <SvgImage
              stroke={
                feeState === 'WITH_FEE'
                  ? tokens.color.white.val
                  : tokens.color.greyOnWhite.val
              }
              source={percentageSvg}
            />
          </Stack>
          <Text
            ff="$body700"
            col={feeState === 'WITH_FEE' ? '$white' : '$greyOnWhite'}
            fos={24}
          >
            {t('createOffer.premiumOrDiscount.premiumOrDiscount')}
          </Text>
        </XStack>
        <Switch
          value={feeState === 'WITH_FEE'}
          onValueChange={onSwitchValueChange}
        />
      </XStack>
      <Text mb="$4" col="$greyOnWhite" fos={16}>
        {offerType === 'BUY'
          ? t('createOffer.buyCheaperByUsingDiscount')
          : t('createOffer.sellFasterWithDiscount')}
      </Text>
      {feeState === 'WITH_FEE' && (
        <YStack space="$2">
          <XStack ai="center" jc="space-between">
            <Text mr="$4" fos={18} ff="$body600" col="$white">
              {offerType === 'BUY'
                ? t('createOffer.premiumOrDiscount.youBuyBtcFor')
                : t('createOffer.premiumOrDiscount.youSellBtcFor')}
            </Text>
            <TouchableOpacity style={{flex: 1}} onPress={() => {}}>
              <XStack f={1} ai="center" jc="center" bc="$grey" br="$4" p="$4">
                <Text mr="$2" fos={16} ff="$body600" col="$greyOnWhite">
                  {t('createOffer.premiumOrDiscount.marketPrice')}
                </Text>
                {feeAmount !== 0 && (
                  <SliderText
                    zeroValue={feeAmount === 0}
                    extremeValue={Math.abs(feeAmount) > SLIDER_THRESHOLD / 2}
                  >
                    {`${feeAmount > 0 ? '+' : '-'} ${Math.abs(feeAmount)} %`}
                  </SliderText>
                )}
              </XStack>
            </TouchableOpacity>
          </XStack>
          <BuySellSlider
            sliderThreshold={SLIDER_THRESHOLD}
            sliderValue={feeAmount}
            onValueChange={onSliderValueChange}
          />
          <Info sliderThreshold={SLIDER_THRESHOLD} />
        </YStack>
      )}
    </YStack>
  )
}

export default PremiumOrDiscount
