import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native'
import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Text} from 'tamagui'
import {type TradeChecklistStackParamsList} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../PageWithNavigationHeader'
import PremiumOrDiscountContent from '../../PremiumOrDiscountContent'
import Content from '../../TradeChecklistFlow/components/Content'
import {tradeCalculatorMolecule} from '../atoms'
import PriceTypeIndicator from './PriceTypeIndicator'

const tempFeeAmountAtom = atom<number>(0)
const offerTypeAtom = atom<OfferType>('BUY')

function PremiumOrDiscountScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const {feeAmountAtom, applyFeeOnFeeChangeActionAtom} = useMolecule(
    tradeCalculatorMolecule
  )
  // TODO: Rework this logic
  // const offerType = useAtomValue(offerTypeAtom)
  const offerType = useAtomValue(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.calculateAmount.premiumOrDiscount')}
        onClose={() => {
          navigation.navigate('AgreeOnTradeDetails')
        }}
      />
      <Content scrollable>
        <Text fos={16} mt="$2" mb="$4" col="$greyOnBlack">
          {offerType === 'BUY'
            ? t('offerForm.buyCheaperByUsingDiscount')
            : t('offerForm.sellFasterWithDiscount')}
        </Text>
        <PremiumOrDiscountContent
          proceedToDetailDisabled
          feeAmountAtom={tempFeeAmountAtom}
          offerTypeAtom={offerTypeAtom}
        >
          <PriceTypeIndicator displayInGrayColor mr="$2" />
        </PremiumOrDiscountContent>
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        onPress={() => {
          applyFeeOnFeeChange(tempFeeAmount)
          goBack()
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default PremiumOrDiscountScreen
