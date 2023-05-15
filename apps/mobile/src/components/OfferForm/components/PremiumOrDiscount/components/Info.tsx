import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, YStack} from 'tamagui'
import SvgImage from '../../../../Image'
import arrowRightSvg from '../images/arrowRightSvg'
import Help from '../../Help'
import stayAnonymousSvg from '../../../../images/stayAnonymousSvg'
import {useMemo, useState} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ComponentContainer from './ComponentContainer'
import {type SetStateAction, useAtomValue, type WritableAtom} from 'jotai'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'
import infoSvg from '../../../../images/infoSvg'

interface Props {
  feeAmountAtom: WritableAtom<number, [SetStateAction<number>], void>
  offerTypeAtom: WritableAtom<OfferType, [SetStateAction<OfferType>], void>

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
    const absSliderValue = Math.abs(feeAmount)
    const halfThreshold = sliderThreshold / 2

    if (offerType === 'BUY') {
      if (feeAmount === 0) {
        return t('offerForm.premiumOrDiscount.youBuyForTheActualMarketPrice')
      } else if (absSliderValue < halfThreshold) {
        return t('offerForm.premiumOrDiscount.theOptimalPositionForMostPeople')
      } else if (feeAmount > halfThreshold) {
        return t('offerForm.premiumOrDiscount.youBuyReallyFast')
      } else {
        return t('offerForm.premiumOrDiscount.youBuyPrettyCheap')
      }
    } else {
      if (feeAmount === 0) {
        return t('offerForm.premiumOrDiscount.youSellForTheActualMarketPrice')
      } else if (feeAmount > 0 && feeAmount <= halfThreshold) {
        return t('offerForm.premiumOrDiscount.youEarnBitMore')
      } else if (feeAmount > halfThreshold) {
        return t('offerForm.premiumOrDiscount.youWantToEarnFortune')
      } else {
        return t('offerForm.premiumOrDiscount.youSellSlightlyFaster')
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
        <ComponentContainer
          fd="row"
          ai="center"
          jc="space-evenly"
          extremeValue={Math.abs(feeAmount) > sliderThreshold / 2}
          zeroValue={feeAmount === 0}
        >
          <Stack als="flex-start">
            <SvgImage fill={elementsColor} source={infoSvg} />
          </Stack>
          <Stack fs={1} px="$2">
            <Text col={elementsColor}>{message}</Text>
          </Stack>
          <Stack als="flex-end">
            <SvgImage stroke={elementsColor} source={arrowRightSvg} />
          </Stack>
        </ComponentContainer>
      </TouchableOpacity>
      <Help
        visible={helpVisible}
        onClose={() => {
          setHelpVisible(false)
        }}
        title={t('offerForm.premiumOrDiscount.premiumOrDiscountExplained')}
        image={stayAnonymousSvg}
      >
        <YStack space="$6">
          <Text fos={18} color="$greyOnWhite">
            {offerType === 'BUY'
              ? t('offerForm.premiumOrDiscount.influenceImpactOfYourBuyOffer')
              : t('offerForm.premiumOrDiscount.influenceImpactOfYourSellOffer')}
          </Text>
          <Text fos={18} color="$greyOnWhite">
            {t('offerForm.premiumOrDiscount.playWithItAndSee')}
          </Text>
        </YStack>
      </Help>
    </>
  )
}

export default Info
