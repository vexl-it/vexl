import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import SvgImage from '../../../Image'
import percentageSvg from './images/percentageSvg'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Switch from '../../../Switch'
import {
  type SetStateAction,
  useAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import {useState} from 'react'
import PremiumOrDiscountDetail from './components/PremiumOrDiscountDetail'
import {
  type FeeState,
  type OfferType,
} from '@vexl-next/domain/dist/general/offers'
import PremiumOrDiscountContent from '../../../PremiumOrDiscountContent'

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
