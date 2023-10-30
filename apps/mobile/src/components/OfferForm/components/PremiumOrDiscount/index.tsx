import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../../Image'
import percentageSvg from './images/percentageSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import {TouchableOpacity} from 'react-native'
import Info from './components/Info'
import BuySellSlider, {SLIDER_THRESHOLD} from './components/BuySellSlider'
import SliderText from './components/SliderText'
import {
  type SetStateAction,
  useAtom,
  useAtomValue,
  type WritableAtom,
} from 'jotai'
import {useState} from 'react'
import PremiumOrDiscountDetail from './components/PremiumOrDiscountDetail'
import {
  type FeeState,
  type OfferType,
} from '@vexl-next/domain/dist/general/offers'

interface Props {
  feeAmountAtom: WritableAtom<number, [SetStateAction<number>], void>
  feeStateAtom: WritableAtom<FeeState, [SetStateAction<FeeState>], void>
  offerTypeAtom: WritableAtom<OfferType, [SetStateAction<OfferType>], void>
}

function PremiumOrDiscount({
  feeAmountAtom,
  feeStateAtom,
  offerTypeAtom,
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()

  const offerType = useAtomValue(offerTypeAtom)
  const [feeAmount, setFeeAmount] = useAtom(feeAmountAtom)
  const [feeState, setFeeState] = useAtom(feeStateAtom)
  const [detailVisible, setDetailVisible] = useState<boolean>(false)

  const onSliderValueChange = (value: number[]): void => {
    setFeeAmount(value[0] ?? 0)
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
        <XStack f={1} ai="center" mr={'$1'}>
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
          <Stack>
            <Text
              numberOfLines={2}
              ff="$body700"
              col={feeState === 'WITH_FEE' ? '$white' : '$greyOnWhite'}
              fos={24}
            >
              {t('offerForm.premiumOrDiscount.premiumOrDiscount')}
            </Text>
          </Stack>
        </XStack>
        <Switch
          value={feeState === 'WITH_FEE'}
          onValueChange={onSwitchValueChange}
        />
      </XStack>
      <Text mb="$4" col="$greyOnWhite" fos={16}>
        {offerType === 'BUY'
          ? t('offerForm.buyCheaperByUsingDiscount')
          : t('offerForm.sellFasterWithDiscount')}
      </Text>
      {feeState === 'WITH_FEE' && (
        <YStack space="$2">
          <XStack f={1} ai="center" jc="space-between">
            <Text maxWidth={'50%'} mr="$4" fos={18} ff="$body600" col="$white">
              {offerType === 'BUY'
                ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
                : t('offerForm.premiumOrDiscount.youSellBtcFor')}
            </Text>
            <TouchableOpacity
              style={{flex: 1}}
              onPress={() => {
                setDetailVisible(true)
              }}
            >
              <XStack f={1} ai="center" jc="center" bc="$grey" br="$4" p="$4">
                <Text mr="$2" fos={16} ff="$body600" col="$greyOnWhite">
                  {t('offerForm.premiumOrDiscount.marketPrice')}
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
            offerTypeAtom={offerTypeAtom}
            sliderThreshold={SLIDER_THRESHOLD}
            sliderValue={feeAmount}
            onValueChange={onSliderValueChange}
          />
          <Info
            feeAmountAtom={feeAmountAtom}
            offerTypeAtom={offerTypeAtom}
            sliderThreshold={SLIDER_THRESHOLD}
          />
        </YStack>
      )}
      {detailVisible && (
        <PremiumOrDiscountDetail
          offerTypeAtom={offerTypeAtom}
          feeAmountAtom={feeAmountAtom}
          onClose={() => {
            setDetailVisible(false)
          }}
          visible={detailVisible}
        />
      )}
    </YStack>
  )
}

export default PremiumOrDiscount
