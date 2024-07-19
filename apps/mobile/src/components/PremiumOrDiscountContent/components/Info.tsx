import {useAtomValue, type Atom} from 'jotai'
import {useMemo, useState} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, YStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../../images/chevronRightSvg'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Help from '../../Help'
import SvgImage from '../../Image'
import infoSvg from '../../images/infoSvg'
import stayAnonymousSvg from '../../images/stayAnonymousSvg'

interface Props {
  feeAmountAtom: Atom<number>
  iAmTheBuyer: boolean
  sliderThreshold: number
}

function Info({
  feeAmountAtom,
  iAmTheBuyer,
  sliderThreshold,
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const [helpVisible, setHelpVisible] = useState<boolean>(false)

  const feeAmount = useAtomValue(feeAmountAtom)

  const elementsColor = useMemo(() => {
    const absFeeAmount = Math.abs(feeAmount)
    if (absFeeAmount > 0 && absFeeAmount <= sliderThreshold / 2) {
      return tokens.color.main.val
    } else if (absFeeAmount > sliderThreshold / 2) {
      return tokens.color.red.val
    } else {
      return tokens.color.white.val
    }
  }, [sliderThreshold, feeAmount, tokens.color])

  const message = useMemo(() => {
    const absFeeAmount = Math.abs(feeAmount)
    const halfThreshold = sliderThreshold / 2

    if (iAmTheBuyer) {
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
  }, [feeAmount, sliderThreshold, iAmTheBuyer, t])

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setHelpVisible(true)
        }}
      >
        <Stack
          fd="row"
          ai="center"
          jc="space-evenly"
          p="$4"
          br="$4"
          bc={
            feeAmount === 0
              ? '$grey'
              : Math.abs(feeAmount) > sliderThreshold / 2
                ? '$redAccent1'
                : '$darkBrown'
          }
        >
          <Stack als="flex-start">
            <SvgImage fill={elementsColor} source={infoSvg} />
          </Stack>
          <Stack fs={1} px="$2">
            <Text col={elementsColor}>{message}</Text>
          </Stack>
          <Stack als="center">
            <SvgImage
              width={20}
              height={20}
              stroke={elementsColor}
              source={chevronRightSvg}
            />
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
        <YStack space="$6">
          <Text fos={18} color="$greyOnWhite">
            {iAmTheBuyer
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
