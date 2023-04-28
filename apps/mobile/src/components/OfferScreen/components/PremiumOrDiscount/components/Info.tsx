import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, YStack} from 'tamagui'
import SvgImage from '../../../../Image'
import infoSvg from '../../../images/infoSvg'
import arrowRightSvg from '../images/arrowRightSvg'
import Help from '../../Help'
import stayAnonymousSvg from '../../../../images/stayAnonymousSvg'
import {useMemo, useState} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ComponentContainer from './ComponentContainer'
import {useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {offerFormStateMolecule} from '../../../atoms/offerFormStateAtoms'

interface Props {
  sliderThreshold: number
}

function Info({sliderThreshold}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()
  const [helpVisible, setHelpVisible] = useState<boolean>(false)

  const {feeAmountAtom, offerTypeAtom} = useMolecule(offerFormStateMolecule)
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
        return t('createOffer.premiumOrDiscount.youBuyForTheActualMarketPrice')
      } else if (absSliderValue < halfThreshold) {
        return t(
          'createOffer.premiumOrDiscount.theOptimalPositionForMostPeople'
        )
      } else if (feeAmount > halfThreshold) {
        return t('createOffer.premiumOrDiscount.youBuyReallyFast')
      } else {
        return t('createOffer.premiumOrDiscount.youBuyPrettyCheap')
      }
    } else {
      if (feeAmount === 0) {
        return t('createOffer.premiumOrDiscount.youSellForTheActualMarketPrice')
      } else if (feeAmount > 0 && feeAmount <= halfThreshold) {
        return t('createOffer.premiumOrDiscount.youEarnBitMore')
      } else if (feeAmount > halfThreshold) {
        return t('createOffer.premiumOrDiscount.youWantToEarnFortune')
      } else {
        return t('createOffer.premiumOrDiscount.youSellSlightlyFaster')
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
        title={t('createOffer.premiumOrDiscount.premiumOrDiscountExplained')}
        image={stayAnonymousSvg}
      >
        <YStack space="$6">
          <Text fos={18} color="$greyOnWhite">
            {offerType === 'BUY'
              ? t('createOffer.premiumOrDiscount.influenceImpactOfYourBuyOffer')
              : t(
                  'createOffer.premiumOrDiscount.influenceImpactOfYourSellOffer'
                )}
          </Text>
          <Text fos={18} color="$greyOnWhite">
            {t('createOffer.premiumOrDiscount.playWithItAndSee')}
          </Text>
        </YStack>
      </Help>
    </>
  )
}

export default Info
