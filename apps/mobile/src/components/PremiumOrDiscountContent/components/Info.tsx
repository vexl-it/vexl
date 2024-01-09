import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, YStack} from 'tamagui'
import SvgImage from '../../Image'
import arrowRightSvg from '../images/arrowRightSvg'
import stayAnonymousSvg from '../../images/stayAnonymousSvg'
import {useMemo, useState} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {type Atom, useAtomValue} from 'jotai'
import {type OfferType} from '@vexl-next/domain/src/general/offers'
import Help from '../../Help'
import infoSvg from '../../images/infoSvg'

interface Props {
  feeAmountAtom: Atom<number>
  offerTypeAtom: Atom<OfferType | undefined>
  sliderThreshold: number
}

function Info({
  feeAmountAtom,
  offerTypeAtom,
  sliderThreshold,
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const [helpVisible, setHelpVisible] = useState<boolean>(false)

  const feeAmount = useAtomValue(feeAmountAtom)
  const offerType = useAtomValue(offerTypeAtom)

  const elementsColor = useMemo(() => {
    const absFeeAmount = Math.abs(feeAmount)
    if (absFeeAmount > 0 && absFeeAmount <= sliderThreshold / 2) {
      return tokens.color.main.val
    } else if (absFeeAmount > sliderThreshold / 2) {
      return tokens.color.red.val
    } else {
      return tokens.color.greyOnBlack.val
    }
  }, [sliderThreshold, feeAmount, tokens.color])

  const message = useMemo(() => {
    const absFeeAmount = Math.abs(feeAmount)
    const halfThreshold = sliderThreshold / 2

    if (offerType === 'BUY') {
      if (feeAmount === 0) {
        return t('offerForm.premiumOrDiscount.youBuyForTheActualMarketPrice')
      } else if (feeAmount > 0) {
        if (feeAmount <= halfThreshold)
          return t(
            'offerForm.premiumOrDiscount.theOptimalPositionForMostPeople'
          )
        return t('offerForm.premiumOrDiscount.youBuyReallyFast')
      } else {
        if (absFeeAmount <= halfThreshold)
          return t('offerForm.premiumOrDiscount.youBuyPrettyCheap')
        return t('offerForm.premiumOrDiscount.youBuyVeryCheaply')
      }
    } else {
      if (feeAmount === 0) {
        return t('offerForm.premiumOrDiscount.youSellForTheActualMarketPrice')
      } else if (feeAmount > 0) {
        if (feeAmount <= halfThreshold)
          return t('offerForm.premiumOrDiscount.youEarnBitMore')
        return t('offerForm.premiumOrDiscount.youEarnSoMuchMore')
      } else {
        if (absFeeAmount <= halfThreshold)
          return t('offerForm.premiumOrDiscount.youSellSlightlyFaster')
        return t('offerForm.premiumOrDiscount.youSellMuchFaster')
      }
    }
  }, [offerType, sliderThreshold, feeAmount, t])

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setHelpVisible(true)
        }}
      >
        <Stack
          fd={'row'}
          ai={'center'}
          jc={'space-evenly'}
          p={'$4'}
          br={'$4'}
          bc={
            feeAmount === 0
              ? '$grey'
              : Math.abs(feeAmount) > sliderThreshold / 2
              ? '$redAccent1'
              : '$darkBrown'
          }
        >
          <Stack als={'flex-start'}>
            <SvgImage fill={elementsColor} source={infoSvg} />
          </Stack>
          <Stack fs={1} px={'$2'}>
            <Text col={elementsColor}>{message}</Text>
          </Stack>
          <Stack als={'flex-end'}>
            <SvgImage stroke={elementsColor} source={arrowRightSvg} />
          </Stack>
        </Stack>
      </TouchableOpacity>
      <Help
        visible={helpVisible}
        onClose={() => {
          setHelpVisible(false)
        }}
        title={t('offerForm.premiumOrDiscount.premiumOrDiscountExplained')}
        image={stayAnonymousSvg}
      >
        <YStack space={'$6'}>
          <Text fos={18} color={'$greyOnWhite'}>
            {offerType === 'BUY'
              ? t('offerForm.premiumOrDiscount.influenceImpactOfYourBuyOffer')
              : t('offerForm.premiumOrDiscount.influenceImpactOfYourSellOffer')}
          </Text>
          <Text fos={18} color={'$greyOnWhite'}>
            {t('offerForm.premiumOrDiscount.playWithItAndSee')}
          </Text>
        </YStack>
      </Help>
    </>
  )
}

export default Info
