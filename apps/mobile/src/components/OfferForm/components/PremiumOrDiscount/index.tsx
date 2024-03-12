import {
  type FeeState,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {useAtom, useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useState} from 'react'
import {Stack, Text, XStack, YStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import SvgImage from '../../../Image'
import PremiumOrDiscountContent from '../../../PremiumOrDiscountContent'
import Switch from '../../../Switch'
import PremiumOrDiscountDetail from './components/PremiumOrDiscountDetail'
import percentageSvg from './images/percentageSvg'

interface Props {
  feeAmountAtom: PrimitiveAtom<number>
  feeStateAtom: PrimitiveAtom<FeeState>
  offerTypeAtom: PrimitiveAtom<OfferType>
}

function PremiumOrDiscount({
  feeAmountAtom,
  feeStateAtom,
  offerTypeAtom,
}: Props): JSX.Element | null {
  const tokens = getTokens()
  const {t} = useTranslation()

  const offerType = useAtomValue(offerTypeAtom)
  const setFeeAmount = useSetAtom(feeAmountAtom)
  const [feeState, setFeeState] = useAtom(feeStateAtom)
  const [detailVisible, setDetailVisible] = useState<boolean>(false)

  const onSwitchValueChange = (): void => {
    if (feeState === 'WITH_FEE') {
      setFeeAmount(0)
    }
    setFeeState(feeState === 'WITHOUT_FEE' ? 'WITH_FEE' : 'WITHOUT_FEE')
  }

  return (
    <YStack mb="$4">
      <XStack ai="center" jc="space-between" py="$4">
        <XStack f={1} ai="center" mr="$1">
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
          <Stack fs={1}>
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
      <Text
        ff="$body600"
        mb="$4"
        col={feeState === 'WITH_FEE' ? '$white' : '$greyOnWhite'}
        fos={16}
      >
        {offerType === 'BUY'
          ? t('offerForm.buyCheaperByUsingDiscount')
          : t('offerForm.sellFasterWithDiscount')}
      </Text>
      {feeState === 'WITH_FEE' && (
        <PremiumOrDiscountContent
          feeAmountAtom={feeAmountAtom}
          offerTypeAtom={offerTypeAtom}
          onProceedToDetailPress={() => {
            setDetailVisible(true)
          }}
        >
          <Text mr="$2" fos={16} ff="$body600" col="$greyOnWhite">
            {t('offerForm.premiumOrDiscount.marketPrice')}
          </Text>
        </PremiumOrDiscountContent>
      )}
      {!!detailVisible && (
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
